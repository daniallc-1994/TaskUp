from datetime import datetime
from uuid import uuid4
from typing import Optional
from sqlalchemy.orm import Session

from .models import Wallet, Transaction, TransactionType, TransactionStatus


def ensure_wallet(db: Session, user_id: str, currency: str = "NOK") -> Wallet:
    wallet: Optional[Wallet] = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if wallet:
        return wallet
    wallet = Wallet(id=str(uuid4()), user_id=user_id, available_balance=0, escrow_balance=0, currency=currency)
    db.add(wallet)
    db.commit()
    db.refresh(wallet)
    return wallet


def create_tx(db: Session, wallet_id: str, type_: TransactionType, amount: int, currency: str, status: TransactionStatus, meta: dict | None = None, stripe_ids: dict | None = None):
    tx = Transaction(
        id=str(uuid4()),
        wallet_id=wallet_id,
        type=type_,
        amount=amount,
        currency=currency,
        status=status,
        meta=meta or {},
        stripe_payment_intent_id=(stripe_ids or {}).get("payment_intent"),
        stripe_transfer_id=(stripe_ids or {}).get("transfer"),
        stripe_refund_id=(stripe_ids or {}).get("refund"),
        stripe_payout_id=(stripe_ids or {}).get("payout"),
        created_at=datetime.utcnow(),
    )
    db.add(tx)
    return tx
