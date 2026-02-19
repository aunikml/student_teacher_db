from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .serializers import (
    UserRegistrationSerializer, 
    ChangePasswordSerializer, 
    UserProfileSerializer,
    MyTokenObtainPairSerializer  # Ensure this is imported
)

# 1. NEW LOGIN VIEW (Fixes the "Invalid Credentials" issue)
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


# 2. PROFILE VIEW: Get current logged in user info
class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# 3. ADMIN VIEW: List all users and Create a new user
class AdminUserManagementView(generics.ListCreateAPIView):
    queryset = User.objects.all().order_by('-id')
    permission_classes = [permissions.IsAdminUser]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserRegistrationSerializer
        return UserProfileSerializer


# 4. ADMIN VIEW: Edit and Delete a specific user
class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAdminUser]

    def delete(self, request, *args, **kwargs):
        user_to_delete = self.get_object()
        if user_to_delete == request.user:
            return Response(
                {"error": "You cannot delete your own admin account."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().delete(request, *args, **kwargs)


# 5. USER VIEW: Change Password
class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            old_pw = serializer.validated_data.get("old_password")
            new_pw = serializer.validated_data.get("new_password")

            # Check if the temporary/old password is correct
            if not user.check_password(old_pw):
                return Response(
                    {"old_password": ["The current temporary password you entered is incorrect."]}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set and hash the new password
            user.set_password(new_pw)
            user.must_change_password = False
            user.save()
            return Response(
                {"message": "Password updated successfully."}, 
                status=status.HTTP_200_OK
            )
        
        # Log errors to terminal for debugging
        print("Password Change Validation Errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)