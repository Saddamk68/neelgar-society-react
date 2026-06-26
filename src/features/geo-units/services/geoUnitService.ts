import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";
import { GeoUnit, GeoLevel, GeoUnitType } from "../geo-unit-types";
import { GeoSelection } from "../components/GeoUnitCascadeSelect";

function unwrap<T>(res: any): T {
    return res.data?.data ?? res.data;
}

export async function listByLevel(level: GeoLevel): Promise<GeoUnit[]> {
    const res = await api.get(ENDPOINTS.geoUnits.byLevel(), { params: { level } });
    return unwrap<GeoUnit[]>(res);
}

export async function listChildren(parentId: number): Promise<GeoUnit[]> {
    const res = await api.get(ENDPOINTS.geoUnits.children(parentId));
    return unwrap<GeoUnit[]>(res);
}

export async function createGeoUnit(
    name: string,
    level: GeoLevel,
    parentId: number | undefined,
    unitType: GeoUnitType | undefined,
    createdBy: string
): Promise<GeoUnit> {
    const res = await api.post(
        ENDPOINTS.geoUnits.create(),
        { name, level, parentId, unitType },
        { headers: { "X-Created-By": createdBy } }
    );
    return unwrap<GeoUnit>(res);
}

export async function deactivateGeoUnit(id: number, updatedBy: string): Promise<void> {
    await api.delete(ENDPOINTS.geoUnits.deactivate(id), {
        headers: { "X-Created-By": updatedBy },
    });
}

export async function getAncestors(geoUnitId: number): Promise<GeoSelection> {
  const res = await api.get(ENDPOINTS.geoUnits.ancestors(geoUnitId));
  return unwrap<GeoSelection>(res);
}
