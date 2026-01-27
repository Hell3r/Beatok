# Forgot Password Feature Implementation

## Backend Changes
- [ ] Extend EmailVerificationModel to support password reset type
- [ ] Add password reset email template in EmailService
- [ ] Add `/forgot-password` endpoint in users.py
- [ ] Add `/reset-password` endpoint in users.py

## Frontend Changes
- [ ] Add 'forgotPassword' mode to AuthModal.tsx
- [ ] Add "forgot password?" button in login form
- [ ] Create PasswordResetPage.tsx
- [ ] Add route for password reset page in App.tsx

## Testing
- [ ] Test email sending functionality
- [ ] Test password reset flow
- [ ] Verify password hashing works correctly
