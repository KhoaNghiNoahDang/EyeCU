import { fetchApi } from "./api/client";

export const supabase = {
  from: (table: string) => ({
    select: () => ({
      eq: (field: string, val: string) => {
        let p;
        if (table === 'dispatch_records' && field === 'status' && (val === 'active' || val === 'completed')) {
          p = fetchApi(`/ems/dispatch_records?status=${val}`)
            .then(data => ({ data: Array.isArray(data) ? data : [] }))
            .catch(() => ({ data: [] }));
        } else {
          p = Promise.resolve({ data: [] });
        }
        p.order = () => p;
        return p;
      }
    }),
    upsert: (data: any) => {
      if (table === 'dispatch_records') {
        return fetchApi('/ems/dispatch_records/upsert', { method: 'POST', body: JSON.stringify(data) }).catch(console.error);
      }
      return Promise.resolve();
    },
    update: (data: any) => ({
      eq: (key: string, val: any) => {
        if (table === 'dispatch_records') {
          if (data.status === 'completed' && key === 'plate') {
            return fetchApi(`/ems/dispatch_records/${val}/complete`, { method: 'PUT' }).catch(console.error);
          } else if (key === 'plate') {
            return fetchApi(`/ems/dispatch_records/${val}`, { method: 'PUT', body: JSON.stringify(data) }).catch(console.error);
          }
        }
        return Promise.resolve();
      }
    })
  }),
  channel: () => ({
    on: () => ({ subscribe: () => ({}) }),
  }),
  removeChannel: () => {}
};
