from rest_framework import serializers
from django.contrib.auth import get_user_model
from boutiques.models import Boutique

User = get_user_model()

# Serializer simple pour éviter le circular import avec boutiques/serializers.py
class BoutiqueSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Boutique
        fields = ['id', 'nom', 'adresse', 'type_boutique']

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    boutiques = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Boutique.objects.all(),
        required=False
    )
    boutiques_detail = BoutiqueSimpleSerializer(
        source='boutiques_gerees',
        many=True,
        read_only=True
    )
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name',
                  'last_name', 'role', 'telephone', 'photo', 'is_active',
                  'boutiques', 'boutiques_detail', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        boutiques = validated_data.pop('boutiques', [])
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        for boutique in boutiques:
            boutique.gestionnaires.add(user)
        return user
    
    def update(self, instance, validated_data):
        boutiques = validated_data.pop('boutiques', None)
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        if boutiques is not None:
            for boutique in instance.boutiques_gerees.all():
                boutique.gestionnaires.remove(instance)
            for boutique in boutiques:
                boutique.gestionnaires.add(instance)
        return instance


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()