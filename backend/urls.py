from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints for existing apps
    path('api/users/', include('users.urls')),
    path('api/config/', include('academic_config.urls')),
    path('api/', include('batches.urls')),          # Batches and Student enrollments
    path('api/course_assign/', include('course_assign.urls')),
    # path('api/courses/', include('courses.urls')), # Omitted as per previous request

    # NEW: API endpoint for the Dashboard app
    path('api/dashboard/', include('dashboard.urls')),

    # NEW: API endpoint for the Alumni app
    path('api/alumni/', include('alumni.urls')),
]