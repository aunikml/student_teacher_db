import string
import random
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

# 1. JWT LOGIN SERIALIZER
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Customizes the JWT token to include user roles and flags.
    Also maps 'username' to the 'email' field for the authentication backend.
    """
    # This explicitly tells SimpleJWT to use the model's defined USERNAME_FIELD
    username_field = User.USERNAME_FIELD

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims into the encrypted token
        token['email'] = user.email
        token['role'] = user.role
        token['first_name'] = user.first_name
        token['must_change_password'] = user.must_change_password

        return token

    def validate(self, attrs):
        # Standard validation (authenticates the user)
        data = super().validate(attrs)
        
        # Add extra data to the plain-text JSON response for the frontend
        data['role'] = self.user.role
        data['must_change_password'] = self.user.must_change_password
        data['email'] = self.user.email
        
        return data


# 2. USER PROFILE SERIALIZER
class UserProfileSerializer(serializers.ModelSerializer):
    """
    Used for general user data display and management.
    """
    class Meta:
        model = User
        fields = [
            'id', 
            'email', 
            'first_name', 
            'last_name', 
            'role', 
            'designation', 
            'must_change_password'
        ]
        read_only_fields = ['email', 'must_change_password']


# 3. USER REGISTRATION SERIALIZER (Used by Admin)
class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Handles admin-led user enrollment.
    Generates a random 12-character password.
    """
    generated_password = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 
            'email', 
            'first_name', 
            'last_name', 
            'designation', 
            'role', 
            'generated_password'
        ]

    def create(self, validated_data):
        # Generate random password including letters, numbers, and symbols
        chars = string.ascii_letters + string.digits + "!@#$%^"
        random_password = ''.join(random.choices(chars, k=12))
        
        # Create user via the custom UserManager
        user = User.objects.create_user(
            email=validated_data['email'],
            password=random_password,
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            designation=validated_data.get('designation', ''),
            role=validated_data.get('role', 'FACULTY'),
        )
        
        # Force the user to change password on first successful login
        user.must_change_password = True
        user.save()
        
        # Attach password to instance so it shows in the API response once
        user.generated_password = random_password
        
        return user


# 4. CHANGE PASSWORD SERIALIZER
class ChangePasswordSerializer(serializers.Serializer):
    """
    Validates password change requests.
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True, 
        min_length=8, 
        write_only=True
    )