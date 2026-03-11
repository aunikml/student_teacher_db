from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AlumniRecordViewSet, FurtherEducationViewSet, AlumniDashboardStatsView

router = DefaultRouter()
router.register(r'alumni', AlumniRecordViewSet, basename='alumnirecord')
router.register(r'further-education', FurtherEducationViewSet, basename='furthereducation')

urlpatterns =[
    path('dashboard-stats/', AlumniDashboardStatsView.as_view(), name='alumni_dashboard_stats'), # <--- ADD THIS LINE
    path('', include(router.urls)),
]