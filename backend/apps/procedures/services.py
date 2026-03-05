from django.db import transaction, models
from apps.core.exceptions import NotFoundError, ValidationError, AuthorizationError
from apps.permissions.engine import PermissionEngine
from apps.permissions.enums import PermissionKey
from .models import Procedure, ProcedureStep, ProcedureTemplate


class ProcedureService:
    @staticmethod
    def get_procedures_for_user(user, include_deleted=False):
        queryset = Procedure.objects.all()

        if not include_deleted:
            queryset = queryset.filter(is_deleted=False)

        return PermissionEngine.filter_queryset(
            queryset, user, PermissionKey.VIEW_PROCEDURES
        )

    @staticmethod
    def get_procedure_by_id(procedure_id, user):
        try:
            procedure = Procedure.objects.get(id=procedure_id, is_deleted=False)
        except Procedure.DoesNotExist:
            raise NotFoundError('Procedure not found')

        if not ProcedureService._can_access_procedure(procedure, user):
            raise AuthorizationError('You do not have access to this procedure')

        return procedure

    @staticmethod
    def _can_access_procedure(procedure, user):
        return PermissionEngine.check(user, PermissionKey.VIEW_PROCEDURES, resource=procedure)

    @staticmethod
    @transaction.atomic
    def create_procedure(organization, entity, title, interval_value, interval_unit,
                         created_by=None, steps_data=None, **kwargs):
        procedure = Procedure.objects.create(
            organization=organization,
            entity=entity,
            title=title,
            interval_value=interval_value,
            interval_unit=interval_unit,
            created_by=created_by,
            **kwargs
        )

        if steps_data:
            for i, step_data in enumerate(steps_data):
                step_data['step_order'] = step_data.get('step_order', i + 1)
                ProcedureStep.objects.create(procedure=procedure, **step_data)

        return procedure

    @staticmethod
    @transaction.atomic
    def update_procedure(procedure, **data):
        allowed_fields = [
            'title', 'description', 'priority', 'interval_value', 
            'interval_unit', 'estimated_duration_minutes', 
            'is_active', 'requires_approval', 'tags'
        ]

        for field, value in data.items():
            if field in allowed_fields and hasattr(procedure, field):
                setattr(procedure, field, value)

        procedure.save()
        return procedure

    @staticmethod
    def soft_delete_procedure(procedure):
        procedure.soft_delete()
        return procedure

    @staticmethod
    def restore_procedure(procedure):
        procedure.restore()
        return procedure

    @staticmethod
    def activate_procedure(procedure):
        procedure.is_active = True
        procedure.save(update_fields=['is_active'])
        return procedure

    @staticmethod
    def deactivate_procedure(procedure):
        procedure.is_active = False
        procedure.save(update_fields=['is_active'])
        return procedure

    @staticmethod
    @transaction.atomic
    def create_from_template(template, entity, user, title=None):
        template_data = template.template_data

        procedure = Procedure.objects.create(
            organization=entity.organization,
            entity=entity,
            title=title or template_data.get('title', template.name),
            description=template_data.get('description'),
            priority=template_data.get('priority', 'MEDIUM'),
            interval_value=template_data.get('interval_value', 1),
            interval_unit=template_data.get('interval_unit', 'DAYS'),
            estimated_duration_minutes=template_data.get('estimated_duration_minutes'),
            requires_approval=template_data.get('requires_approval', False),
            tags=template_data.get('tags', []),
            created_by=user
        )

        steps_data = template_data.get('steps', [])
        for step_data in steps_data:
            ProcedureStep.objects.create(
                procedure=procedure,
                step_order=step_data.get('step_order', 1),
                title=step_data.get('title', ''),
                description=step_data.get('description'),
                requires_photo=step_data.get('requires_photo', False),
                requires_notes=step_data.get('requires_notes', False),
                requires_compliance_check=step_data.get('requires_compliance_check', False),
                expected_duration_minutes=step_data.get('expected_duration_minutes'),
                reference_images=step_data.get('reference_images', []),
                checklist_items=step_data.get('checklist_items', [])
            )

        template.usage_count += 1
        template.save(update_fields=['usage_count'])

        return procedure


class ProcedureStepService:
    @staticmethod
    @transaction.atomic
    def create_step(procedure, step_order, title, **kwargs):
        existing = ProcedureStep.objects.filter(procedure=procedure, step_order=step_order).first()
        if existing:
            ProcedureStep.objects.filter(
                procedure=procedure,
                step_order__gte=step_order
            ).update(step_order=models.F('step_order') + 1)

        step = ProcedureStep.objects.create(
            procedure=procedure,
            step_order=step_order,
            title=title,
            **kwargs
        )
        return step

    @staticmethod
    def update_step(step, **data):
        allowed_fields = [
            'title', 'description', 'step_order',
            'requires_photo', 'requires_notes', 'requires_compliance_check',
            'expected_duration_minutes', 'reference_images', 'checklist_items'
        ]

        for field, value in data.items():
            if field in allowed_fields and hasattr(step, field):
                setattr(step, field, value)

        step.save()
        return step

    @staticmethod
    def delete_step(step):
        procedure = step.procedure
        step_order = step.step_order
        step.delete()

        ProcedureStep.objects.filter(
            procedure=procedure,
            step_order__gt=step_order
        ).update(step_order=models.F('step_order') - 1)

    @staticmethod
    @transaction.atomic
    def reorder_steps(procedure, step_orders):
        for item in step_orders:
            ProcedureStep.objects.filter(
                procedure=procedure,
                id=item['id']
            ).update(step_order=item['order'])


class ProcedureTemplateService:
    @staticmethod
    def get_templates_for_user(user):
        if user.role == 'SUPER_ADMIN':
            return ProcedureTemplate.objects.all()
        
        return ProcedureTemplate.objects.filter(
            models.Q(organization=user.organization) | models.Q(is_public=True)
        )

    @staticmethod
    @transaction.atomic
    def create_template(organization, name, template_data, created_by=None, **kwargs):
        template = ProcedureTemplate.objects.create(
            organization=organization,
            name=name,
            template_data=template_data,
            created_by=created_by,
            **kwargs
        )
        return template

    @staticmethod
    @transaction.atomic
    def create_template_from_procedure(procedure, name=None, is_public=False):
        template_data = {
            'title': procedure.title,
            'description': procedure.description,
            'priority': procedure.priority,
            'interval_value': procedure.interval_value,
            'interval_unit': procedure.interval_unit,
            'estimated_duration_minutes': procedure.estimated_duration_minutes,
            'requires_approval': procedure.requires_approval,
            'tags': procedure.tags,
            'steps': []
        }

        for step in procedure.steps.all():
            template_data['steps'].append({
                'step_order': step.step_order,
                'title': step.title,
                'description': step.description,
                'requires_photo': step.requires_photo,
                'requires_notes': step.requires_notes,
                'requires_compliance_check': step.requires_compliance_check,
                'expected_duration_minutes': step.expected_duration_minutes,
                'reference_images': step.reference_images,
                'checklist_items': step.checklist_items
            })

        template = ProcedureTemplate.objects.create(
            organization=procedure.organization,
            name=name or f"Template: {procedure.title}",
            description=procedure.description,
            category=procedure.entity.entity_type,
            template_data=template_data,
            is_public=is_public,
            created_by=procedure.created_by
        )
        return template
