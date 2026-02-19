from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BatchViewSet, 
    StudentViewSet, 
    StudentCourseEnrollmentViewSet # IMPORTANT: Include the new ViewSet
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'batches', BatchViewSet, basename='batch')
router.register(r'students', StudentViewSet, basename='student')
router.register(r'student-enrollments', StudentCourseEnrollmentViewSet, basename='student-enrollment') # NEW ROUTE

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
]