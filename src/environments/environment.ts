export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5116',
  analytics: {
    enabled: true,
    gaMeasurementId: 'G-XXXXXXXXXX', // Injected via environment or GTM
    gadsConversionId: 'AW-XXXXXXXXX', // Injected via environment
    gtmId: 'GTM-XXXXXXX', // Injected via environment
  },
  socialAuth: {
    googleClientId: '673486800223-gdcljglad4eiq8hldroa2m2qhc7emnf8.apps.googleusercontent.com',
    facebookAppId: '1577422820551494',
  }
};
