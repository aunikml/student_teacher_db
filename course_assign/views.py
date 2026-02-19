from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import CourseAssignment
from .serializers import CourseAssignmentSerializer

# 1. PERMISSION CLASS (Re-usable permission logic)
class IsAdmin(permissions.BasePermission):
    """
    Custom permission to only allow users with the 'ADMIN' role.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'

# 2. VIEWSET
class CourseAssignmentViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for Course Assignments.
    - Admins can create, read, update, and delete all assignments.
    - Faculty members can only read assignments they are assigned to.
    - Program Information Managers (PIM) can read all assignments.
    """
    serializer_class = CourseAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated] # Base permission, specifics handled in methods/get_queryset

    def get_queryset(self):
        """
        Dynamically filters the queryset based on the user's role.
        """
        user = self.request.user
        
        # Admins and PIMs can see all assignments
        if user.role in ['ADMIN', 'PIM']:
            return CourseAssignment.objects.all().order_by('-start_date')
        
        # Faculty members only see courses they are specifically assigned to
        if user.role == 'FACULTY':
            return CourseAssignment.objects.filter(faculty=user).order_by('-start_date')
            
        # For any other role (e.g., Program Supervisor), return an empty list
        return CourseAssignment.objects.none()

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        For 'create', 'update', 'partial_update', and 'destroy', we enforce Admin-only access.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdmin]
        else:
            # For 'list' and 'retrieve', IsAuthenticated is sufficient (queryset filtering handles the rest)
            self.permission_classes = [permissions.IsAuthenticated]
        return super(CourseAssignmentViewSet, self).get_permissions()

    def create(self, request, *args, **kwargs):
        """
        Handles the creation of a new CourseAssignment.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        """
        Saves the new CourseAssignment instance.
        """
        serializer.save()

    def update(self, request, *args, **kwargs):
        """
        Handles updating an existing CourseAssignment.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def perform_update(self, serializer):
        """
        Saves the updated CourseAssignment instance.
        """
        serializer.save()