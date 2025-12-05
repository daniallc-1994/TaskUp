from datetime import datetime
from typing import Optional, Any

from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    Enum,
)
from sqlalchemy.orm import declarative_base, relationship
import enum

Base = declarative_base()


class UserRole(str, enum.Enum):
    client = "client"
    tasker = "tasker"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.client, nullable=False)
    language = Column(String, default="en")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    stripe_customer_id = Column(String)
    stripe_connect_account_id = Column(String)  # TODO: set from onboarding when tasker connects Stripe
    kyc_status = Column(String)
    risk_score = Column(Float, default=0.0)
    flags = Column(JSON)
    reset_token = Column(String)
    reset_token_expires_at = Column(DateTime)

    tasks = relationship("Task", back_populates="client")
    wallet = relationship("Wallet", uselist=False, back_populates="user")


class TaskStatus(str, enum.Enum):
    open = "open"
    assigned = "assigned"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
    disputed = "disputed"
    client_confirmed = "client_confirmed"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True)
    client_id = Column(String, ForeignKey("users.id"), nullable=False)
    assigned_offer_id = Column(String, ForeignKey("offers.id"), nullable=True)
    assigned_tasker_id = Column(String, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)
    location = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    budget_min = Column(Integer)
    budget_max = Column(Integer)
    currency = Column(String, default="NOK")
    status = Column(Enum(TaskStatus), default=TaskStatus.open, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime)

    client = relationship("User", back_populates="tasks")
    offers = relationship("Offer", back_populates="task", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="task", cascade="all, delete-orphan")
    disputes = relationship("Dispute", back_populates="task", cascade="all, delete-orphan")


class OfferStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    withdrawn = "withdrawn"


class Offer(Base):
    __tablename__ = "offers"

    id = Column(String, primary_key=True)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    tasker_id = Column(String, ForeignKey("users.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    currency = Column(String, default="NOK")
    message = Column(Text)
    status = Column(Enum(OfferStatus), default=OfferStatus.pending, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    task = relationship("Task", back_populates="offers")
    tasker = relationship("User")


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    available_balance = Column(Integer, default=0)
    escrow_balance = Column(Integer, default=0)
    currency = Column(String, default="NOK")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="wallet")
    transactions = relationship("Transaction", back_populates="wallet")
    payments = relationship("Payment", back_populates="wallet")


class PaymentStatus(str, enum.Enum):
    escrowed = "escrowed"
    payment_released = "payment_released"
    refunded = "refunded"
    failed = "failed"
    disputed = "disputed"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    offer_id = Column(String, ForeignKey("offers.id"), nullable=False)
    client_id = Column(String, ForeignKey("users.id"), nullable=False)
    tasker_id = Column(String, ForeignKey("users.id"), nullable=False)
    wallet_id = Column(String, ForeignKey("wallets.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    currency = Column(String, default="NOK")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.escrowed)
    stripe_payment_intent_id = Column(String)
    stripe_charge_id = Column(String)
    stripe_transfer_id = Column(String)
    stripe_refund_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    wallet = relationship("Wallet", back_populates="payments")
    task = relationship("Task")
    offer = relationship("Offer")


class TransactionType(str, enum.Enum):
    topup = "topup"
    escrow_hold = "escrow_hold"
    release = "release"
    refund = "refund"
    partial_refund = "partial_refund"
    payout = "payout"


class TransactionStatus(str, enum.Enum):
    pending = "pending"
    succeeded = "succeeded"
    failed = "failed"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True)
    wallet_id = Column(String, ForeignKey("wallets.id"), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    amount = Column(Integer, nullable=False)
    currency = Column(String, default="NOK")
    stripe_payment_intent_id = Column(String)
    stripe_payout_id = Column(String)
    stripe_transfer_id = Column(String)
    stripe_refund_id = Column(String)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.pending)
    meta = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    wallet = relationship("Wallet", back_populates="transactions")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(String, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)

    task = relationship("Task", back_populates="messages")


class DisputeStatus(str, enum.Enum):
    open = "open"
    under_review = "under_review"
    resolved_client = "resolved_client"
    resolved_tasker = "resolved_tasker"
    refunded = "refunded"
    partial_refund = "partial_refund"


class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(String, primary_key=True)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    raised_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    against_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    reason = Column(String, nullable=False)
    description = Column(Text)
    status = Column(Enum(DisputeStatus), default=DisputeStatus.open)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    task = relationship("Task", back_populates="disputes")
    raised_by = relationship("User", foreign_keys=[raised_by_id])
    against_user = relationship("User", foreign_keys=[against_user_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    data = Column(JSON)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class AdminLog(Base):
    __tablename__ = "admin_logs"

    id = Column(String, primary_key=True)
    admin_id = Column(String, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    entity = Column(String, nullable=False)
    entity_id = Column(String, nullable=True)
    details = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    admin = relationship("User")
