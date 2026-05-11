import 'package:flutter/material.dart';

import 'app_localizations.dart';

export 'app_localizations.dart';

class L10n {
  static const supportedLocales = [
    Locale('en'),
    Locale('ta'),
    Locale('hi'),
  ];

  static AppLocalizations of(BuildContext context) {
    return AppLocalizations.of(context);
  }
}
