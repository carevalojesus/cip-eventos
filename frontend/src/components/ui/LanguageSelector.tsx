import { useTranslation } from "react-i18next";
import { Button } from "./button";
import { switchLocale, getCurrentLocale, type Locale } from "@/lib/routes";

const languages: { code: Locale; name: string; flag: string }[] = [
  { code: "es", name: "ES", flag: "🇪🇸" },
  { code: "en", name: "EN", flag: "🇺🇸" },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const currentLocale = getCurrentLocale();

  const handleChangeLanguage = (lng: Locale) => {
    if (lng === currentLocale) return;
    i18n.changeLanguage(lng);
    switchLocale(lng);
  };

  return (
    <div className="flex gap-1">
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant={currentLocale === lang.code ? "default" : "ghost"}
          size="sm"
          onClick={() => handleChangeLanguage(lang.code)}
          className="gap-1.5 px-2"
        >
          <span>{lang.flag}</span>
          <span className="text-xs font-medium">{lang.name}</span>
        </Button>
      ))}
    </div>
  );
}
