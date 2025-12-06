from datetime import datetime
from typing import Optional, Any, List
from pydantic import BaseModel, EmailStr, Field
from ..models import (
    UserRole,
    TaskStatus,
    OfferStatus,
    TransactionType,
    TransactionStatus,
    DisputeStatus,
    PaymentStatus,
)


# User
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.client
    language: Optional[str] = "en"

    class Config:
        use_enum_values = True


class UserCreate(UserBase):
    password: str
    stripe_customer_id: Optional[str] = None
    device_fingerprint: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    language: Optional[str] = None


class UserOut(UserBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    stripe_customer_id: Optional[str] = None
    kyc_status: Optional[str] = None
    risk_score: Optional[float] = 0.0
    flags: Optional[dict] = None

    class Config:
        orm_mode = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    device_fingerprint: Optional[str] = None


class RegisterRequest(UserCreate):
    name: Optional[str] = None
    role: Optional[UserRole] = UserRole.client

    class Config:
        use_enum_values = True


class TokenResponse(BaseModel):
    ok: bool = True
    user: UserOut
    access_token: str
    token_type: str = "bearer"


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    language: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# Task
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    currency: str = "NOK"


class TaskCreate(TaskBase):
    due_date: Optional[datetime] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[TaskStatus] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    currency: Optional[str] = None
    due_date: Optional[datetime] = None

    class Config:
        use_enum_values = True


class TaskOut(TaskBase):
    id: str
    client_id: str
    assigned_offer_id: Optional[str] = None
    assigned_tasker_id: Optional[str] = None
    status: TaskStatus
    created_at: datetime
    due_date: Optional[datetime] = None

    class Config:
        orm_mode = True
        use_enum_values = True


# Offer
class OfferBase(BaseModel):
    task_id: str
    amount_cents: int
    currency: str = "NOK"
    message: Optional[str] = None


class OfferCreate(OfferBase):
    tasker_id: Optional[str] = None


class OfferUpdate(BaseModel):
    status: Optional[OfferStatus] = None

    class Config:
        use_enum_values = True


class OfferOut(OfferBase):
    id: str
    tasker_id: str
    status: OfferStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        use_enum_values = True


# Wallet / Transactions
class WalletOut(BaseModel):
    id: str
    user_id: str
    available_balance: int
    escrow_balance: int
    currency: str
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class TransactionOut(BaseModel):
    id: str
    wallet_id: str
    type: TransactionType
    amount: int
    currency: str
    stripe_payment_intent_id: Optional[str] = None
    stripe_payout_id: Optional[str] = None
    status: TransactionStatus
    meta: Optional[dict] = None
    created_at: datetime

    class Config:
        orm_mode = True
        use_enum_values = True


class PaymentCreate(BaseModel):
    task_id: str
    offer_id: str
    amount_cents: int
    currency: str = "NOK"


class PaymentOut(BaseModel):
    id: str
    task_id: str
    offer_id: str
    client_id: str
    tasker_id: str
    wallet_id: str
    status: PaymentStatus = PaymentStatus.escrowed
    amount_cents: int = Field(..., alias="amount")
    currency: str = "NOK"
    payment_intent_id: Optional[str] = Field(None, alias="stripe_payment_intent_id")
    transfer_id: Optional[str] = Field(None, alias="stripe_transfer_id")
    charge_id: Optional[str] = Field(None, alias="stripe_charge_id")
    refund_id: Optional[str] = Field(None, alias="stripe_refund_id")
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
        use_enum_values = True


# Message
class MessageBase(BaseModel):
    task_id: str
    receiver_id: str
    content: str


class MessageCreate(MessageBase):
    pass


class MessageOut(MessageBase):
    id: str
    sender_id: str
    created_at: datetime
    is_read: bool = False

    class Config:
        orm_mode = True


# Dispute
class DisputeBase(BaseModel):
    task_id: str
    against_user_id: str
    reason: str
    description: Optional[str] = None


class DisputeCreate(DisputeBase):
    pass


class DisputeUpdate(BaseModel):
    status: Optional[DisputeStatus] = None
    description: Optional[str] = None

    class Config:
        use_enum_values = True


class DisputeOut(DisputeBase):
    id: str
    raised_by_id: str
    status: DisputeStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        use_enum_values = True


class DisputeResolve(BaseModel):
    resolution: str
    note: Optional[str] = None


# Notification
class NotificationCreate(BaseModel):
    user_id: str
    type: str
    title: str
    body: str
    data: Optional[Any] = None


class NotificationOut(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    body: str
    data: Optional[Any] = None
    is_read: bool = False
    created_at: datetime

    class Config:
        orm_mode = True


class NotificationReadResponse(BaseModel):
    ok: bool = True


class AcceptOffer(BaseModel):
    offer_id: str


class DeviceFingerprintOut(BaseModel):
    id: str
    user_id: str
    ip_address: str
    fingerprint: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True
