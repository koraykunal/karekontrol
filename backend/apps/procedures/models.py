from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import TimestampMixin, SoftDeleteMixin
from apps.core.constants import ProcedurePriority, IntervalUnit


class Procedure(TimestampMixin, SoftDeleteMixin):
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='procedures'
    )
    entity = models.ForeignKey(
        'entities.Entity',
        on_delete=models.CASCADE,
        related_name='procedures'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    priority = models.CharField(
        max_length=20,
        choices=ProcedurePriority.choices,
        default=ProcedurePriority.MEDIUM,
        db_index=True
    )
    interval_value = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(3650)])
    interval_unit = models.CharField(
        max_length=20,
        choices=IntervalUnit.choices,
        default=IntervalUnit.DAYS
    )
    estimated_duration_minutes = models.PositiveIntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(1)]
    )
    is_active = models.BooleanField(default=True, db_index=True)
    requires_approval = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_procedures'
    )
    tags = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = 'procedures'
        ordering = ['-priority', '-created_at']
        indexes = [
            models.Index(fields=['organization', 'entity']),
            models.Index(fields=['priority', 'is_active']),
            models.Index(fields=['entity', 'is_active']),
        ]
        verbose_name = 'Procedure'
        verbose_name_plural = 'Procedures'

    def __str__(self):
        return f"{self.title} - {self.entity.name}"

    @property
    def total_steps(self):
        if hasattr(self, '_prefetched_objects_cache') and 'steps' in self._prefetched_objects_cache:
            return len(self._prefetched_objects_cache['steps'])
        return self.steps.count()

    @property
    def estimated_duration_formatted(self):
        if not self.estimated_duration_minutes:
            return "N/A"
        hours = self.estimated_duration_minutes // 60
        minutes = self.estimated_duration_minutes % 60
        if hours > 0:
            return f"{hours}h {minutes}m"
        return f"{minutes}m"


class ProcedureStep(TimestampMixin):
    procedure = models.ForeignKey(
        Procedure,
        on_delete=models.CASCADE,
        related_name='steps'
    )
    step_order = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    requires_photo = models.BooleanField(default=False)
    requires_notes = models.BooleanField(default=False)
    requires_compliance_check = models.BooleanField(default=False)
    expected_duration_minutes = models.PositiveIntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(1)]
    )
    reference_images = models.JSONField(default=list, blank=True)
    checklist_items = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = 'procedure_steps'
        ordering = ['procedure', 'step_order']
        constraints = [
            models.UniqueConstraint(
                fields=['procedure', 'step_order'],
                name='unique_procedure_step_order'
            )
        ]
        indexes = [
            models.Index(fields=['procedure', 'step_order']),
        ]
        verbose_name = 'Procedure Step'
        verbose_name_plural = 'Procedure Steps'

    def __str__(self):
        return f"Step {self.step_order}: {self.title}"

    @property
    def is_required(self):
        return self.requires_photo or self.requires_notes or self.requires_compliance_check


class ProcedureTemplate(TimestampMixin):
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='procedure_templates'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    template_data = models.JSONField()
    is_public = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_templates'
    )
    usage_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'procedure_templates'
        ordering = ['-usage_count', '-created_at']
        indexes = [
            models.Index(fields=['organization', 'is_public']),
            models.Index(fields=['category']),
        ]
        verbose_name = 'Procedure Template'
        verbose_name_plural = 'Procedure Templates'

    def __str__(self):
        return self.name
