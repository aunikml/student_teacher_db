from rest_framework import viewsets, permissions, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q

from .models import AlumniRecord, FurtherEducation
from .serializers import AlumniRecordSerializer, FurtherEducationSerializer
from academic_config.models import Program # Import Program model

class IsAdminOrPIM(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in['ADMIN', 'PIM']

class AlumniRecordViewSet(viewsets.ModelViewSet):
    # ... (This viewset remains the same) ...
    serializer_class = AlumniRecordSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrPIM]
    filter_backends =[filters.SearchFilter]
    search_fields =['student_id', 'first_name', 'last_name', 'current_occupation']

    def get_queryset(self):
        queryset = AlumniRecord.objects.all().order_by('-updated_at')
        sector = self.request.query_params.get('sector')
        subsector = self.request.query_params.get('subsector')
        if sector: queryset = queryset.filter(professional_sector=sector)
        if subsector: queryset = queryset.filter(professional_sector_sub_category=subsector)
        return queryset

class FurtherEducationViewSet(viewsets.ModelViewSet):
    # ... (This viewset remains the same) ...
    queryset = FurtherEducation.objects.all()
    serializer_class = FurtherEducationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrPIM]
    filterset_fields = ['alumni']

# MODIFIED: AlumniDashboardStatsView
class AlumniDashboardStatsView(APIView):
    permission_classes =[permissions.IsAuthenticated, IsAdminOrPIM]

    def get(self, request):
        total_alumni = AlumniRecord.objects.count()

        # 1. Alumni Program Wise
        program_distribution = Program.objects.annotate(
            alumni_count=Count('batches__students__alumni_record')
        ).filter(alumni_count__gt=0).values('name', 'alumni_count').order_by('-alumni_count')

        # 2. Professional Sector Distribution
        sector_distribution = AlumniRecord.objects.exclude(
            Q(professional_sector__isnull=True) | Q(professional_sector__exact='')
        ).values('professional_sector').annotate(count=Count('id')).order_by('-count')

        # 3. Sub-sector Breakdown (specifically for Private and Government)
        govt_sub_sector = AlumniRecord.objects.filter(professional_sector='Government').exclude(
            Q(professional_sector_sub_category__isnull=True) | Q(professional_sector_sub_category__exact='')
        ).values('professional_sector_sub_category').annotate(count=Count('id')).order_by('-count')
        
        private_sub_sector = AlumniRecord.objects.filter(professional_sector='Private').exclude(
            Q(professional_sector_sub_category__isnull=True) | Q(professional_sector_sub_category__exact='')
        ).values('professional_sector_sub_category').annotate(count=Count('id')).order_by('-count')

        # 4. Data Health
        # We define "Complete" as having an occupation, sector, and country.
        complete_profiles = AlumniRecord.objects.exclude(
            Q(current_occupation__isnull=True) | Q(current_occupation__exact='') |
            Q(professional_sector__isnull=True) | Q(professional_sector__exact='') |
            Q(current_country_of_residence__isnull=True) | Q(current_country_of_residence__exact='')
        ).count()
        
        completeness_percentage = round((complete_profiles / total_alumni * 100), 1) if total_alumni > 0 else 0

        return Response({
            "total_alumni": total_alumni,
            "program_distribution": list(program_distribution),
            "sector_distribution": list(sector_distribution),
            "sub_sector_distribution": {
                "government": list(govt_sub_sector),
                "private": list(private_sub_sector)
            },
            "data_health": {
                "completeness_percentage": completeness_percentage,
                "complete_profiles": complete_profiles
            }
        })