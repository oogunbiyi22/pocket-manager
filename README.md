# Backstage App

Backstage is the working app shell for the product defined in `../backstage-product/`.

## What is built so far
Initial frontend foundation and route shells for:
- landing page
- dashboard
- onboarding
- projects list
- create project
- project workspace shell
- manager page shell
- settings page shell

## Current direction
- modern, premium, minimal product shell
- manager-first experience
- Backstage Vault as the in-app storage system
- route and component structure designed to expand cleanly

## Next coding steps
1. add shared header/sidebar polish and mobile nav handling
2. introduce reusable cards, buttons, and form controls
3. wire onboarding and project creation to real state/data
4. add Supabase auth, database, and storage integration
5. build Backstage Vault upload flow
6. build manager prompt UI and recommendations layer
7. build promo/pitch and budget modules

## Notes
Backend integrations are intentionally not wired yet in this phase. The current goal is strong app structure and a premium shell before data plumbing.
