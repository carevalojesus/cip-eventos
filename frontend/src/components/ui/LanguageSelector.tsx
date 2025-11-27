import { useTranslation } from "react-i18next";
import { Button } from "./button";

const languages = [
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "en", name: "English", flag: "🇺🇸" },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // Forzar recarga para actualizar el atributo lang del HTML
    window.location.reload();
  };

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant={i18n.language === lang.code ? "default" : "outline"}
          size="sm"
          onClick={() => changeLanguage(lang.code)}
          className="gap-2"
        >
          <span>{lang.flag}</span>
          <span>{lang.name}</span>
        </Button>
      ))}
    </div>
  );
}
