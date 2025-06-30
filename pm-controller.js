class PaymentMethodController {
  constructor(paymentMethods = []) {
    this.paymentMethods = paymentMethods;
    this.paymentMethodRules = {
      // Amount-based rules (in cents)
      amountRules: {
        klarna: { min: 10000, max: 1000000 }, // $105 - $10,000
        afterpay_clearpay: { min: 100, max: 200000 }, // $1 - $2,000
        affirm: { min: 15000, max: 3000000 }, // $150 - $30,000
        zip: { min: 100, max: 100000 }, // $1 - $1,000
        paypal: { min: 100, max: 6000000 }, // $1 - $60,000
        card: { min: 50, max: 99999999 }, // $0.50+
        us_bank_account: { min: 100, max: null }, // $1+
        sepa_debit: { min: 50, max: null }, // €0.50+
        acss_debit: { min: 50, max: null }, // CAD $0.50+
      },

      // Currency-based rules
      currencyRules: {
        klarna: ["usd", "eur", "gbp", "sek", "nok", "dkk"],
        afterpay_clearpay: ["usd", "aud", "cad", "nzd", "gbp"],
        affirm: ["usd", "cad"],
        zip: ["usd", "aud"],
        sepa_debit: ["eur"],
        acss_debit: ["cad"],
        us_bank_account: ["usd"],
        bacs_debit: ["gbp"],
        paypal: ["usd", "eur", "gbp", "aud", "cad", "jpy"],
      },

      // Country-based rules
      countryRules: {
        klarna: [
          "US",
          "CA",
          "GB",
          "DE",
          "AT",
          "NL",
          "BE",
          "CH",
          "SE",
          "NO",
          "DK",
          "FI",
        ],
        afterpay_clearpay: ["US", "CA", "AU", "NZ", "GB"],
        affirm: ["US", "CA"],
        zip: ["US", "AU"],
        acss_debit: ["CA"],
        us_bank_account: ["US"],
        sepa_debit: [
          "AT",
          "BE",
          "BG",
          "HR",
          "CY",
          "CZ",
          "DK",
          "EE",
          "FI",
          "FR",
          "DE",
          "GR",
          "HU",
          "IE",
          "IT",
          "LV",
          "LT",
          "LU",
          "MT",
          "NL",
          "PL",
          "PT",
          "RO",
          "SK",
          "SI",
          "ES",
          "SE",
        ],
        bacs_debit: ["GB"],
      },
    };
  }

  // Filter payment methods based on business rules
  filterPaymentMethods(amount, currency, country, customerSegment = "default") {
    return this.paymentMethods.filter((method) => {
      // Check amount constraints
      if (!this.checkAmountConstraints(method, amount)) return false;

      // Check currency support
      // if (!this.checkCurrencySupport(method, currency)) return false;

      // Check country support
      // if (!this.checkCountrySupport(method, country)) return false;

      // Check customer segment rules (premium customers, etc.)
      // if (!this.checkCustomerSegmentRules(method, customerSegment))
      // return false;

      return true;
    });
  }

  checkAmountConstraints(method, amount) {
    const rules = this.paymentMethodRules.amountRules[method];
    if (!rules) return true; // No rules means allowed

    if (rules.min && amount < rules.min) return false;
    if (rules.max && amount > rules.max) return false;

    return true;
  }

  checkCurrencySupport(method, currency) {
    const supportedCurrencies = this.paymentMethodRules.currencyRules[method];
    if (!supportedCurrencies) return true; // No rules means allowed

    return supportedCurrencies.includes(currency.toLowerCase());
  }

  checkCountrySupport(method, country) {
    const supportedCountries = this.paymentMethodRules.countryRules[method];
    if (!supportedCountries) return true; // No rules means allowed

    return supportedCountries.includes(country.toUpperCase());
  }

  checkCustomerSegmentRules(method, segment) {
    // Example: Only allow certain methods for premium customers
    const segmentRules = {
      premium: ["card", "paypal", "apple_pay", "google_pay"], // Premium gets fewer, faster methods
      enterprise: ["card", "us_bank_account", "sepa_debit"], // Enterprise gets bank transfers
      default: null, // Default allows all filtered methods
    };

    const allowedMethods = segmentRules[segment];
    if (!allowedMethods) return true; // No segment rules

    return allowedMethods.includes(method);
  }
}

export default PaymentMethodController;
