# FW Dynamic Payment Methods Demo App

## Overview

`fw-dynamic-payment-methods` repo is for the testing of stripe payment element, specifically dynamic payment method configuration.

## Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (Latest LTS recommended)

## Installation

Clone the repository and install dependencies:

```sh
npm install
```

## Scripts

The following scripts are available:

### Custom payment method configuration server

```sh
npm start
```

Browse `http://localhost:4000`

### Running Dynamic payment method configuration server

```sh
npm run dynamic-pm
```

Browse `http://localhost:4001`

## Environment Variables

This project uses `dotenv` for environment configuration. Add a `.env` file in the root directory with required variables. An example `.env.example` is provided for it. The content is

```
STRIPE_SECRET_KEY=sk_replace_with_your_key
STRIPE_PUBLISHABLE_KEY=pk_replace_with_your_key
PORT=4000
DYNAMIC_PM_PORT=4001

```
