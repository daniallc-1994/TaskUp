from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Literal
from datetime import datetime


class User(BaseModel):
    id: str = Field(..., alias="uid", description="Supabase auth user id")
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "client"
    rating: Optional[float] = None
    language: Optional[str] = "en"
    currency: Optional[str] = "NOK"
    is_blocked: bool = False
    kyc_status: Optional[str] = "not_started"
    risk_score: Optional[float] = 0.0
    flags: Optional[dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = "client"
    language: Optional[str] = "en"
    device_fingerprint: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    device_fingerprint: Optional[str] = None


class Task(BaseModel):
    id: str
    client_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    budget_cents: Optional[int] = None
    currency: str = "NOK"
    status: str = "new"
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    budget_cents: Optional[int] = None
    currency: str = "NOK"
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    category: Optional[str] = None


class Offer(BaseModel):
    id: str
    task_id: str
    tasker_id: str
    amount_cents: int
    message: Optional[str] = None
    status: str = "pending"
    eta_minutes: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class OfferCreate(BaseModel):
    task_id: str
    amount_cents: int
    message: Optional[str] = None
    eta_minutes: Optional[int] = None
    tasker_id: Optional[str] = None


class AcceptOffer(BaseModel):
    offer_id: str


class Message(BaseModel):
    id: str
    task_id: str
    sender_id: str
    recipient_id: str
    body: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MessageCreate(BaseModel):
    task_id: str
    sender_id: str
    recipient_id: str
    body: str


class Payment(BaseModel):
    id: str
    task_id: str
    offer_id: str
    status: str = "escrowed"
    amount_cents: int
    currency: str = "NOK"
    payment_intent_id: Optional[str] = None
    transfer_id: Optional[str] = None
    charge_id: Optional[str] = None
    refund_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class PaymentCreate(BaseModel):
    task_id: str
    offer_id: str
    amount_cents: int
    currency: str = "NOK"


class Dispute(BaseModel):
    id: str
    task_id: str
    payment_id: str
    opened_by: str
    reason: str
    status: str = "open"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class DisputeCreate(BaseModel):
    task_id: str
    payment_id: str
    opened_by: str
    reason: str


class DisputeResolve(BaseModel):
    resolution: Literal["release", "refund", "dismiss"]
    note: Optional[str] = None
