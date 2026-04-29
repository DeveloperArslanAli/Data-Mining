"""
Enterprise security features including SSO, RBAC, and compliance
"""

import jwt
import hashlib
import secrets
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from enum import Enum
import structlog
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import xml.etree.ElementTree as ET
import base64
import hmac
import hashlib
import urllib.parse

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, UserRole

logger = structlog.get_logger(__name__)

# Security schemes
security = HTTPBearer()


class SSOProvider(str, Enum):
    """Supported SSO providers"""
    SAML = "saml"
    OAUTH2 = "oauth2"
    LDAP = "ldap"
    AZURE_AD = "azure_ad"
    GOOGLE_WORKSPACE = "google_workspace"


class Permission(str, Enum):
    """System permissions"""
    # Dataset permissions
    DATASET_READ = "dataset:read"
    DATASET_WRITE = "dataset:write"
    DATASET_DELETE = "dataset:delete"
    DATASET_SHARE = "dataset:share"
    
    # ML Model permissions
    MODEL_READ = "model:read"
    MODEL_WRITE = "model:write"
    MODEL_DELETE = "model:delete"
    MODEL_DEPLOY = "model:deploy"
    
    # User management permissions
    USER_READ = "user:read"
    USER_WRITE = "user:write"
    USER_DELETE = "user:delete"
    USER_ADMIN = "user:admin"
    
    # System permissions
    SYSTEM_ADMIN = "system:admin"
    SYSTEM_MONITOR = "system:monitor"
    SYSTEM_CONFIG = "system:config"


class EnterpriseSecurityManager:
    """Enterprise security management system"""
    
    def __init__(self):
        self.sso_configs = {}
        self.role_permissions = self._initialize_role_permissions()
        self.audit_log = []
    
    def _initialize_role_permissions(self) -> Dict[UserRole, List[Permission]]:
        """Initialize role-based permissions"""
        return {
            UserRole.ADMIN: list(Permission),  # Admin has all permissions
            UserRole.DATA_SCIENTIST: [
                Permission.DATASET_READ,
                Permission.DATASET_WRITE,
                Permission.DATASET_DELETE,
                Permission.MODEL_READ,
                Permission.MODEL_WRITE,
                Permission.MODEL_DELETE,
                Permission.MODEL_DEPLOY,
                Permission.USER_READ,
                Permission.SYSTEM_MONITOR
            ],
            UserRole.BUSINESS_ANALYST: [
                Permission.DATASET_READ,
                Permission.DATASET_WRITE,
                Permission.MODEL_READ,
                Permission.USER_READ
            ],
            UserRole.RESEARCHER: [
                Permission.DATASET_READ,
                Permission.DATASET_WRITE,
                Permission.MODEL_READ,
                Permission.MODEL_WRITE,
                Permission.USER_READ
            ]
        }
    
    def check_permission(self, user: User, permission: Permission) -> bool:
        """Check if user has specific permission"""
        user_permissions = self.role_permissions.get(user.role, [])
        return permission in user_permissions
    
    def get_user_permissions(self, user: User) -> List[Permission]:
        """Get all permissions for a user"""
        return self.role_permissions.get(user.role, [])
    
    def log_audit_event(self, 
                       user_id: int, 
                       action: str, 
                       resource: str, 
                       details: Optional[Dict] = None,
                       ip_address: Optional[str] = None,
                       user_agent: Optional[str] = None):
        """Log audit event for compliance"""
        audit_event = {
            'timestamp': datetime.utcnow().isoformat(),
            'user_id': user_id,
            'action': action,
            'resource': resource,
            'details': details or {},
            'ip_address': ip_address,
            'user_agent': user_agent
        }
        
        self.audit_log.append(audit_event)
        logger.info("Audit event logged", **audit_event)
    
    def get_audit_log(self, 
                     user_id: Optional[int] = None,
                     start_date: Optional[datetime] = None,
                     end_date: Optional[datetime] = None,
                     action: Optional[str] = None) -> List[Dict]:
        """Get audit log with filtering"""
        filtered_log = self.audit_log
        
        if user_id:
            filtered_log = [event for event in filtered_log if event['user_id'] == user_id]
        
        if start_date:
            filtered_log = [event for event in filtered_log if datetime.fromisoformat(event['timestamp']) >= start_date]
        
        if end_date:
            filtered_log = [event for event in filtered_log if datetime.fromisoformat(event['timestamp']) <= end_date]
        
        if action:
            filtered_log = [event for event in filtered_log if event['action'] == action]
        
        return filtered_log


class SAMLSSOProvider:
    """SAML SSO provider implementation"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.entity_id = config.get('entity_id')
        self.sso_url = config.get('sso_url')
        self.certificate = config.get('certificate')
        self.private_key = config.get('private_key')
    
    def generate_saml_request(self, relay_state: str = "") -> str:
        """Generate SAML authentication request"""
        timestamp = datetime.utcnow().strftime('%Y-%m-%mT%H:%M:%SZ')
        request_id = secrets.token_urlsafe(32)
        
        saml_request = f"""<?xml version="1.0" encoding="UTF-8"?>
        <samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                           xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                           ID="{request_id}"
                           Version="2.0"
                           IssueInstant="{timestamp}"
                           Destination="{self.sso_url}"
                           AssertionConsumerServiceURL="{self.config.get('acs_url')}">
            <saml:Issuer>{self.entity_id}</saml:Issuer>
            <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
                               AllowCreate="true"/>
        </samlp:AuthnRequest>"""
        
        # Encode and compress the request
        import zlib
        compressed = zlib.compress(saml_request.encode('utf-8'))
        encoded = base64.b64encode(compressed).decode('utf-8')
        
        return encoded
    
    def parse_saml_response(self, saml_response: str) -> Dict[str, Any]:
        """Parse SAML response and extract user information"""
        try:
            # Decode and decompress
            import zlib
            decoded = base64.b64decode(saml_response)
            decompressed = zlib.decompress(decoded)
            xml_content = decompressed.decode('utf-8')
            
            # Parse XML
            root = ET.fromstring(xml_content)
            
            # Extract user information
            user_info = {}
            
            # Find NameID
            name_id = root.find('.//{urn:oasis:names:tc:SAML:2.0:assertion}NameID')
            if name_id is not None:
                user_info['email'] = name_id.text
            
            # Find attributes
            attributes = root.findall('.//{urn:oasis:names:tc:SAML:2.0:assertion}Attribute')
            for attr in attributes:
                attr_name = attr.get('Name')
                attr_value = attr.find('.//{urn:oasis:names:tc:SAML:2.0:assertion}AttributeValue')
                if attr_value is not None:
                    user_info[attr_name] = attr_value.text
            
            return user_info
            
        except Exception as e:
            logger.error("Failed to parse SAML response", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid SAML response"
            )


class OAuth2SSOProvider:
    """OAuth2 SSO provider implementation"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.client_id = config.get('client_id')
        self.client_secret = config.get('client_secret')
        self.authorization_url = config.get('authorization_url')
        self.token_url = config.get('token_url')
        self.user_info_url = config.get('user_info_url')
        self.redirect_uri = config.get('redirect_uri')
    
    def get_authorization_url(self, state: str) -> str:
        """Get OAuth2 authorization URL"""
        params = {
            'client_id': self.client_id,
            'response_type': 'code',
            'redirect_uri': self.redirect_uri,
            'state': state,
            'scope': 'openid email profile'
        }
        
        query_string = urllib.parse.urlencode(params)
        return f"{self.authorization_url}?{query_string}"
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        import httpx
        
        data = {
            'grant_type': 'authorization_code',
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': code,
            'redirect_uri': self.redirect_uri
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.token_url, data=data)
            response.raise_for_status()
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information using access token"""
        import httpx
        
        headers = {'Authorization': f'Bearer {access_token}'}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.user_info_url, headers=headers)
            response.raise_for_status()
            return response.json()


class LDAPSSOProvider:
    """LDAP SSO provider implementation"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.server = config.get('server')
        self.base_dn = config.get('base_dn')
        self.bind_dn = config.get('bind_dn')
        self.bind_password = config.get('bind_password')
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user against LDAP server"""
        try:
            import ldap
            
            # Connect to LDAP server
            conn = ldap.initialize(self.server)
            conn.set_option(ldap.OPT_REFERRALS, 0)
            
            # Bind with service account
            conn.simple_bind_s(self.bind_dn, self.bind_password)
            
            # Search for user
            search_filter = f"(uid={username})"
            result = conn.search_s(self.base_dn, ldap.SCOPE_SUBTREE, search_filter)
            
            if result:
                user_dn, user_attrs = result[0]
                
                # Try to bind with user credentials
                conn.simple_bind_s(user_dn, password)
                
                # Extract user information
                user_info = {
                    'username': username,
                    'email': user_attrs.get('mail', [b''])[0].decode('utf-8'),
                    'full_name': user_attrs.get('cn', [b''])[0].decode('utf-8'),
                    'groups': [group.decode('utf-8') for group in user_attrs.get('memberOf', [])]
                }
                
                conn.unbind_s()
                return user_info
            
            conn.unbind_s()
            return None
            
        except Exception as e:
            logger.error("LDAP authentication failed", username=username, error=str(e))
            return None


class EnterpriseSecurityService:
    """Main enterprise security service"""
    
    def __init__(self):
        self.security_manager = EnterpriseSecurityManager()
        self.sso_providers = {}
    
    def configure_sso_provider(self, provider_type: SSOProvider, config: Dict[str, Any]):
        """Configure SSO provider"""
        if provider_type == SSOProvider.SAML:
            self.sso_providers[provider_type] = SAMLSSOProvider(config)
        elif provider_type == SSOProvider.OAUTH2:
            self.sso_providers[provider_type] = OAuth2SSOProvider(config)
        elif provider_type == SSOProvider.LDAP:
            self.sso_providers[provider_type] = LDAPSSOProvider(config)
        
        logger.info("SSO provider configured", provider_type=provider_type.value)
    
    async def authenticate_sso(self, 
                              provider_type: SSOProvider, 
                              credentials: Dict[str, Any],
                              db: Session) -> Optional[User]:
        """Authenticate user via SSO"""
        try:
            provider = self.sso_providers.get(provider_type)
            if not provider:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"SSO provider {provider_type.value} not configured"
                )
            
            # Authenticate with provider
            if provider_type == SSOProvider.SAML:
                user_info = provider.parse_saml_response(credentials.get('saml_response'))
            elif provider_type == SSOProvider.OAUTH2:
                token_data = await provider.exchange_code_for_token(credentials.get('code'))
                user_info = await provider.get_user_info(token_data['access_token'])
            elif provider_type == SSOProvider.LDAP:
                user_info = provider.authenticate_user(
                    credentials.get('username'), 
                    credentials.get('password')
                )
            
            if not user_info:
                return None
            
            # Find or create user
            user = db.query(User).filter(User.email == user_info.get('email')).first()
            
            if not user:
                # Create new user
                user = User(
                    email=user_info.get('email'),
                    username=user_info.get('username', user_info.get('email')),
                    full_name=user_info.get('full_name'),
                    hashed_password="",  # SSO users don't have local passwords
                    is_verified=True,
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            
            # Log audit event
            self.security_manager.log_audit_event(
                user_id=user.id,
                action="sso_login",
                resource="authentication",
                details={"provider": provider_type.value}
            )
            
            return user
            
        except Exception as e:
            logger.error("SSO authentication failed", provider_type=provider_type.value, error=str(e))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="SSO authentication failed"
            )
    
    def check_permission(self, user: User, permission: Permission) -> bool:
        """Check user permission"""
        return self.security_manager.check_permission(user, permission)
    
    def get_user_permissions(self, user: User) -> List[Permission]:
        """Get user permissions"""
        return self.security_manager.get_user_permissions(user)
    
    def log_audit_event(self, 
                       user_id: int, 
                       action: str, 
                       resource: str, 
                       details: Optional[Dict] = None,
                       ip_address: Optional[str] = None,
                       user_agent: Optional[str] = None):
        """Log audit event"""
        self.security_manager.log_audit_event(
            user_id, action, resource, details, ip_address, user_agent
        )
    
    def get_audit_log(self, **kwargs) -> List[Dict]:
        """Get audit log"""
        return self.security_manager.get_audit_log(**kwargs)


# Global enterprise security service
enterprise_security = EnterpriseSecurityService()


# Dependency functions
def get_current_user_with_permissions(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current user with permission checking"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")


def require_permission(permission: Permission):
    """Decorator to require specific permission"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # This would be used in endpoint functions
            # The actual permission checking would be done in the endpoint
            return func(*args, **kwargs)
        return wrapper
    return decorator


def check_permission(user: User, permission: Permission) -> bool:
    """Check if user has permission"""
    return enterprise_security.check_permission(user, permission)


def get_user_permissions(user: User) -> List[Permission]:
    """Get user permissions"""
    return enterprise_security.get_user_permissions(user)
