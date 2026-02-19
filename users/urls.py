from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    MyTokenObtainPairView,  # The new custom login view
    AdminUserManagementView, 
    AdminUserDetailView,
    ChangePasswordView, 
    UserProfileView
)

urlpatterns = [
    # Auth
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # User Management (Admin Only)
    path('manage/', AdminUserManagementView.as_view(), name='manage_users_list'),
    path('manage/<int:pk>/', AdminUserDetailView.as_view(), name='manage_user_detail'),
]