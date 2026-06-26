export type GeoLevel = "COUNTRY" | "STATE" | "DISTRICT" | "VILLAGE_TOWN";
export type GeoUnitType = "VILLAGE" | "TOWN";

export type GeoUnit = {
    id: number;
    name: string;
    level: GeoLevel;
    unitType?: GeoUnitType;
    parentId?: number;
    path: string;
    isActive: boolean;
};
