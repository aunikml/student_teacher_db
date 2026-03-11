from rest_framework import viewsets, permissions, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q

from .models import AlumniRecord, FurtherEducation
from .serializers import AlumniRecordSerializer, FurtherEducationSerializer

class IsAdminOrPIM(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in['ADMIN', 'PIM']

class AlumniRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AlumniRecordSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrPIM]
    filter_backends =[filters.SearchFilter]
    
    # Text search fields
    search_fields =[
        'student_id', 
        'first_name', 
        'last_name', 
        'current_occupation'
    ]

    def get_queryset(self):
        queryset = AlumniRecord.objects.all().order_by('-updated_at')
        
        # Explicit dropdown filters
        sector = self.request.query_params.get('sector')
        subsector = self.request.query_params.get('subsector')
        
        if sector:
            queryset = queryset.filter(professional_sector=sector)
        if subsector:
            queryset = queryset.filter(professional_sector_sub_category=subsector)
            
        return queryset

class FurtherEducationViewSet(viewsets.ModelViewSet):
    queryset = FurtherEducation.objects.all()
    serializer_class = FurtherEducationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrPIM]
    filterset_fields = ['alumni']

class AlumniDashboardStatsView(APIView):
    permission_classes =[permissions.IsAuthenticated, IsAdminOrPIM]

    def get(self, request):
        total_alumni = AlumniRecord.objects.count()
        employed_count = AlumniRecord.objects.exclude(Q(current_occupation__isnull=True) | Q(current_occupation__exact='')).count()
        further_ed_count = AlumniRecord.objects.filter(further_educations__isnull=False).distinct().count()
        countries_count = AlumniRecord.objects.exclude(Q(current_country_of_residence__isnull=True) | Q(current_country_of_residence__exact='')).values('current_country_of_residence').distinct().count()
        sector_distribution = AlumniRecord.objects.exclude(Q(professional_sector__isnull=True) | Q(professional_sector__exact='')).values('professional_sector').annotate(count=Count('id')).order_by('-count')
        sub_sector_distribution = AlumniRecord.objects.exclude(Q(professional_sector_sub_category__isnull=True) | Q(professional_sector_sub_category__exact='')).values('professional_sector_sub_category').annotate(count=Count('id')).order_by('-count')
        top_employers = AlumniRecord.objects.exclude(Q(current_professional_affiliation__isnull=True) | Q(current_professional_affiliation__exact='')).values('current_professional_affiliation').annotate(count=Count('id')).order_by('-count')[:5]
        complete_profiles = AlumniRecord.objects.exclude(
            Q(current_occupation__isnull=True) | Q(current_occupation__exact='') |
            Q(professional_sector__isnull=True) | Q(professional_sector__exact='') |
            Q(current_country_of_residence__isnull=True) | Q(current_country_of_residence__exact='') |
            Q(city__isnull=True) | Q(city__exact='')
        ).count()
        completeness_percentage = round((complete_profiles / total_alumni * 100), 1) if total_alumni > 0 else 0

        return Response({
            "kpis": {
                "total_alumni": total_alumni, "employed": employed_count,
                "further_education": further_ed_count, "total_countries": countries_count,
                "completeness_percentage": completeness_percentage
            },
            "insights": {
                "sectors": list(sector_distribution), "sub_sectors": list(sub_sector_distribution),
                "top_employers": list(top_employers)
            }
        })