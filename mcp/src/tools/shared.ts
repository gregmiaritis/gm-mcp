export const json = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

export const notFound = (what: string, id: string, hint: string) =>
  json({ error: `No ${what} with id '${id}'.`, hint });
