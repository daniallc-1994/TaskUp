import * as Sentry from "sentry-expo";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    enableInExpoDevelopment: true,
    debug: false,
  });
}
