# Context Guide for an External AI Module Working on Tamara Land

This document is meant to help an external AI module understand the project correctly before it generates or edits any UI code.

The goal is not to ask the AI to "guess" the design. The goal is to give it enough context so it can preserve the existing structure, brand identity, architecture, and styling rules without making inconsistent changes.

---

# Role of the AI

Treat the AI as a design-aware implementation assistant for this Angular storefront.

It should:

- understand the project architecture
- understand the existing design system
- recognize the existing visual language
- preserve the current brand identity
- keep the UI aligned with the existing implementation
- reuse existing patterns whenever possible
- generate production-ready code
- minimize unnecessary changes

It should not:

- invent a completely different visual system
- replace the current design with a generic template
- ignore existing component conventions
- rename components unnecessarily
- introduce inconsistent styling
- perform unrelated refactoring

---

# Project Overview

Tamara Land is a modern Angular e-commerce storefront for a premium fashion brand.

The visual identity is intentionally:

- dark
- premium
- elegant
- luxurious
- warm
- editorial
- polished
- fashion-forward

The interface should feel refined and feminine without becoming overly decorative.

The brand language is centered around luxurious minimalism rather than excessive effects.

---

# Core Technology Stack

The project uses:

- Angular 20
- Standalone Components
- TypeScript
- Tailwind CSS
- CSS Variables
- Component-scoped CSS

Styling is intentionally split between:

- global design tokens
- reusable utility classes
- feature-specific component styles

The AI should understand where each responsibility belongs before adding new styles.

---

# Angular Conventions

The project follows modern Angular patterns.

Prefer:

- Standalone Components
- Angular Signals where appropriate
- Angular Control Flow syntax (`@if`, `@for`, `@switch`)
- Strong typing
- OnPush Change Detection where appropriate
- Dependency Injection using `inject()`

Avoid:

- deprecated Angular syntax
- unnecessary RxJS when Signals are sufficient
- excessive subscriptions
- legacy structural directives when newer syntax exists

---

# Coding Philosophy

The project favors clean, maintainable code.

The AI should:

- keep components focused
- avoid unnecessary abstractions
- prefer readability over clever code
- avoid duplicated HTML
- move business logic into the component class
- keep templates clean
- avoid inline styles
- write self-explanatory code

---

# Main Project Structure

The application is organized by feature folders.

Important directories:

- src/app/features/home
- src/app/features/catalog
- src/app/features/cart
- src/app/features/checkout
- src/app/features/orders
- src/app/features/wishlist
- src/app/features/addresses
- src/app/features/auth
- src/app/layout
- src/app/shared

The AI should preserve this architecture and avoid introducing unrelated logic into the wrong feature.

---

# Design System

The existing design system is the single source of truth.

Never replace it.

Always extend it.

---

## Color Palette

Primary:

- warm metallic gold

Secondary:

- ink black
- charcoal backgrounds

Accent:

- champagne

Text:

- soft white
- muted gray

Never introduce random colors that don't fit the palette.

---

## Typography

Headings:

Cormorant Garamond

Body:

Tajawal

Maintain the same editorial hierarchy throughout the application.

---

## Visual Language

The project uses:

- dark premium backgrounds
- elegant typography
- rounded cards
- soft shadows
- subtle gradients
- restrained motion
- luxurious spacing
- editorial layouts

The design should feel expensive rather than flashy.

---

# Existing UI Patterns

Always reuse existing UI patterns.

Do not invent alternatives unless necessary.

### Shared Buttons

- .btn
- .btn-primary
- .btn-secondary
- .btn-outline

### Shared Sections

- .section-header
- .section-title
- .section-kicker
- .section-copy

### Product Cards

- .product-card
- .product-card__info
- .product-card__name
- .product-card__price-row

### Homepage Patterns

- Hero Banner
- Category Cards
- Featured Products
- Trust Strip
- Editorial Brand Banner
- Loading Skeletons

Whenever possible, mirror these implementations.

---

# Tailwind Usage

Tailwind should primarily handle:

- layout
- spacing
- flex
- grid
- responsiveness
- alignment

Avoid:

- excessively long utility chains
- replacing reusable CSS with duplicated utilities

Reusable styling belongs inside component CSS or global styles.

---

# CSS Rules

Prefer:

- CSS Variables
- existing utility classes
- component-scoped CSS
- BEM naming

Avoid:

- !important
- duplicated selectors
- deeply nested selectors
- arbitrary spacing values
- arbitrary colors

Always reuse existing design tokens first.

---

# Motion

Animations should feel premium.

Preferred:

- opacity fades
- slight translateY
- subtle scaling
- smooth hover elevation

Avoid:

- bouncing
- spinning
- flashy transitions
- exaggerated shadows

Motion should support the interface—not distract from it.

---

# Icons

Reuse the existing icon library.

Do not introduce a second icon system.

Maintain consistent:

- sizing
- spacing
- stroke weight

---

# Images

Images should:

- preserve aspect ratio
- use lazy loading
- include descriptive alt text
- use object-fit appropriately
- avoid unnecessary cropping

---

# Accessibility

Accessibility should never be sacrificed.

Always use:

- semantic HTML
- accessible labels
- keyboard-friendly interactions
- visible focus states
- proper button elements

---

# Performance

Avoid introducing unnecessary complexity.

Prefer:

- track expressions in loops
- lazy loading
- optimized images
- minimal DOM nodes
- efficient change detection

---

# Responsive Philosophy

The project is mobile-first.

Every new component should:

- work on 360px width
- scale naturally to tablets
- expand gracefully to desktop

Avoid desktop-first layouts.

---

# Empty States

When data is unavailable:

- preserve spacing
- reuse existing empty-state styling
- provide meaningful messaging

Do not leave blank sections.

---

# Loading States

Prefer:

- skeleton loaders

Avoid:

- unnecessary spinners

Reuse existing loading components whenever possible.

---

# Error Handling

Always reuse the existing error component.

Do not invent new error styles.

Error states should remain visually consistent across the application.

---

# Forms

Authentication and checkout forms should:

- reuse shared input components
- preserve validation behavior
- display validation messages consistently
- maintain existing spacing and typography

---

# Naming Conventions

Choose meaningful names.

Avoid names such as:

- temp
- wrapper
- box
- card2
- newComponent

Names should reflect business meaning.

---

# Editing Existing Components

When modifying an existing component:

- preserve Inputs
- preserve Outputs
- preserve public APIs
- preserve CSS class names
- avoid unnecessary refactoring
- avoid renaming files
- keep changes focused

Only modify what is required.

---

# Git-Friendly Changes

The AI should generate clean diffs.

Prefer:

- minimal edits
- preserved formatting
- localized changes
- no unrelated formatting changes

Every commit should be easy to review.

---

# Files the AI Should Inspect First

Before editing anything, inspect:

- src/styles.css
- src/app/app.css
- src/app/features/home/pages/home/home.page.css
- src/app/features/home/components/hero-banner/hero-banner.component.html
- src/app/features/home/components/featured-products/featured-products.component.html
- src/app/features/catalog/components/product-card/product-card.component.html
- src/app/features/catalog/components/product-card/product-card.component.css
- tailwind.config.js

These files define the project's visual language.

---

# Component Creation Checklist

Before creating a new component, verify:

- Does a similar component already exist?
- Can an existing shared component be reused?
- Is there already a matching UI pattern?
- Does this belong in the current feature folder?
- Can existing CSS classes be reused?

---

# Rules the AI Must Follow

- Do not break the existing visual language.
- Prefer extending the design system over replacing it.
- Reuse existing components whenever possible.
- Preserve existing spacing and hierarchy.
- Maintain consistent typography.
- Use existing CSS variables.
- Keep the UI responsive.
- Follow existing naming conventions.
- Keep the code clean and production-ready.
- Do not introduce unnecessary complexity.

---

# What the AI Should Understand Before Editing

Before making any changes, the AI should be able to answer:

1. Which section is being modified?
2. Which existing component is being extended?
3. Which design tokens should be reused?
4. Which layout pattern should remain unchanged?
5. Which existing UI pattern is most similar?
6. Which shared components already solve this problem?
7. Which visual tone should the new UI match?

If these questions cannot be answered confidently, inspect the existing implementation before making changes.

---

# Golden Rule

Before generating any code:

Inspect the existing implementation.

Do not assume.

Mirror the project's existing patterns.

If multiple solutions are possible, choose the one already used elsewhere in the project.

Consistency is always more important than novelty.

---

# Final Expectation

Every generated component should be:

- visually consistent
- structurally aligned
- Angular best-practice compliant
- production-ready
- accessible
- responsive
- performant
- maintainable

The most important principle is:

**Do not allow the project to become generic, inconsistent, or disconnected from the Tamara Land brand identity. Every new piece of UI should feel like it has always belonged to the project.**