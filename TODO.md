# Promo Code System Fixes and Simplification

## Tasks

- [ ] Update PromoType enum in models/promo.py: remove DISCOUNT, keep BALANCE and PERCENT
- [ ] Update PromoCodeBase schema in schemas/promo.py: remove DISCOUNT from enum
- [ ] Update PromoService.py: remove DISCOUNT logic, change PERCENT to add percentage bonus to balance
- [ ] Fix balance type consistency: use Decimal for balance operations
- [ ] Update API router comments: remove "недоработана" (underdeveloped) mentions
- [ ] Update validation logic in schemas and service
- [ ] Test the changes
