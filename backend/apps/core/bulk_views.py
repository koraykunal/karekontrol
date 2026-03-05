import magic
from io import BytesIO

from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from apps.core.permissions import IsAdmin
from apps.core.excel_templates import generate_entity_template, generate_procedure_template
from apps.core.import_service import EntityImportService, ProcedureImportService
from apps.organizations.models import Organization


XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024  # 10MB


class BulkImportViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def _get_organization(self, request):
        """Resolve organization: SUPER_ADMIN can specify, ADMIN uses their own."""
        if request.user.role == 'SUPER_ADMIN':
            org_id = request.data.get('organization') or request.query_params.get('organization')
            if org_id:
                try:
                    return Organization.objects.get(id=org_id)
                except Organization.DoesNotExist:
                    return None
            return request.user.organization
        return request.user.organization

    @action(detail=False, methods=['get'], url_path='templates/(?P<template_type>entities|procedures)')
    def download_template(self, request, template_type=None):
        if template_type == 'entities':
            wb = generate_entity_template()
            filename = 'varlik_sablonu.xlsx'
        else:
            wb = generate_procedure_template()
            filename = 'prosedur_sablonu.xlsx'

        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        response = HttpResponse(buffer.getvalue(), content_type=XLSX_CONTENT_TYPE)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    def _validate_xlsx(self, file):
        """Validate uploaded file is a real XLSX via magic bytes and size."""
        if file.size > MAX_IMPORT_FILE_SIZE:
            return 'Dosya boyutu 10MB\'dan büyük olamaz'
        mime = magic.from_buffer(file.read(2048), mime=True)
        file.seek(0)
        if mime != XLSX_CONTENT_TYPE:
            return 'Geçersiz dosya formatı. Sadece .xlsx dosyaları kabul edilir'
        return None

    @action(detail=False, methods=['post'], url_path='entities')
    def import_entities(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({
                'success': False,
                'message': 'Dosya sağlanmadı',
            }, status=status.HTTP_400_BAD_REQUEST)

        error = self._validate_xlsx(file)
        if error:
            return Response({
                'success': False,
                'message': error,
            }, status=status.HTTP_400_BAD_REQUEST)

        organization = self._get_organization(request)
        if not organization:
            return Response({
                'success': False,
                'message': 'Organizasyon bulunamadı',
            }, status=status.HTTP_400_BAD_REQUEST)

        result = EntityImportService.process(file, organization, request.user)
        http_status = status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST
        return Response(result, status=http_status)

    @action(detail=False, methods=['post'], url_path='procedures')
    def import_procedures(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({
                'success': False,
                'message': 'Dosya sağlanmadı',
            }, status=status.HTTP_400_BAD_REQUEST)

        error = self._validate_xlsx(file)
        if error:
            return Response({
                'success': False,
                'message': error,
            }, status=status.HTTP_400_BAD_REQUEST)

        organization = self._get_organization(request)
        if not organization:
            return Response({
                'success': False,
                'message': 'Organizasyon bulunamadı',
            }, status=status.HTTP_400_BAD_REQUEST)

        result = ProcedureImportService.process(file, organization, request.user)
        http_status = status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST
        return Response(result, status=http_status)
