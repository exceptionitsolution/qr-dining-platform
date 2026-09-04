from pydantic import BaseModel, Field
from typing import List, Optional

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: dict

class SendOtpRequest(BaseModel):
    phone: str

class SendOtpResponse(BaseModel):
    status: str
    demo_otp: Optional[str] = None
    sent_real_sms: bool = False
    message: Optional[str] = "OTP sent"

class VerifyOtpRequest(BaseModel):
    phone: str
    otp: str

class VerifyOtpResponse(BaseModel):
    otp_token: str

class OrderItemInput(BaseModel):
    item_id: str
    qty: int

class CreateOrderRequest(BaseModel):
    table_id: str
    customer_name: Optional[str] = "Guest"
    phone: Optional[str] = ""
    otp_token: Optional[str] = ""
    payment_mode: str
    items: List[OrderItemInput]
    instructions: Optional[str] = ""

class UpdateOrderStatusRequest(BaseModel):
    status: str  # pending, preparing, ready, completed, cancelled

class VerifyPaymentRequest(BaseModel):
    order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class ReviewCreateRequest(BaseModel):
    order_id: str
    rating: int
    comment: Optional[str] = ""

class MenuItemPayload(BaseModel):
    name: str
    description: Optional[str] = ""
    category: str
    price: float
    is_veg: bool = True
    image_url: Optional[str] = ""
    available: bool = True
    is_bestseller: bool = False
    spice_level: int = 1  # 1: Mild, 2: Medium, 3: Hot

