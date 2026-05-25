import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";
import { Gotra } from "../gotra-types";

function unwrap<T>(res: any): T {
  return res.data?.data ?? res.data;
}

export async function listGotras(societyId: number): Promise<Gotra[]> {
  const res = await api.get(ENDPOINTS.gotras.list(), { params: { societyId } });
  return unwrap<Gotra[]>(res);
}

export async function createGotra(
  societyId: number,
  name: string,
  createdBy: string
): Promise<Gotra> {
  const res = await api.post(
    ENDPOINTS.gotras.create(),
    { societyId, name },
    { headers: { "X-Created-By": createdBy } }
  );
  return unwrap<Gotra>(res);
}

export async function updateGotra(
  id: number,
  societyId: number,
  name: string,
  updatedBy: string
): Promise<Gotra> {
  const res = await api.put(
    ENDPOINTS.gotras.update(id),
    { societyId, name },
    { headers: { "X-Created-By": updatedBy } }
  );
  return unwrap<Gotra>(res);
}

export async function deactivateGotra(
  id: number,
  updatedBy: string
): Promise<void> {
  await api.delete(ENDPOINTS.gotras.deactivate(id), {
    headers: { "X-Created-By": updatedBy },
  });
}
