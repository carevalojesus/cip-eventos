import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, MapPin, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { EventLocation } from "@/types/event";
import { eventsService } from "@/services/events.service";

interface LocationAutocompleteProps {
  value: string;
  onSelect: (location: EventLocation | null) => void;
  onInputChange: (value: string) => void;
  placeholder?: string;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onSelect,
  onInputChange,
  placeholder = "Buscar nombre del lugar...",
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [locations, setLocations] = useState<EventLocation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const data = await eventsService.getUniqueLocations();
        setLocations(data);
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setLoading(false);
      }
    };

    if (open && locations.length === 0) {
      fetchLocations();
    }
  }, [open]);

  const handleSelect = (location: EventLocation) => {
    onSelect(location);
    onInputChange(location.name || location.address);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("event.location.search", "Buscar nombre del lugar...")}
            value={value}
            onValueChange={onInputChange}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {t("form.loading", "Cargando...")}
              </div>
            ) : (
              <>
                <CommandEmpty>
                  <div className="py-6 text-center text-sm">
                    <p className="text-muted-foreground">
                      {t("event.location.no_results", "No se encontraron ubicaciones")}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("event.location.create_new", "Escribe para crear un nuevo lugar")}
                    </p>
                  </div>
                </CommandEmpty>
                <CommandGroup heading={t("event.location.recent", "Ubicaciones recientes")}>
                  {locations
                    .filter(loc => {
                      const searchName = loc.name || loc.address;
                      return searchName.toLowerCase().includes(value.toLowerCase());
                    })
                    .map((location) => {
                      const displayName = location.name || location.address;
                      return (
                        <CommandItem
                          key={location.id}
                          value={displayName}
                          onSelect={() => handleSelect(location)}
                        >
                          <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                          <div className="flex flex-col flex-1">
                            <span className="text-sm font-medium">{displayName}</span>
                            <span className="text-xs text-muted-foreground">
                              {location.address} • {location.city}
                            </span>
                          </div>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              value === displayName ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      );
                    })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
