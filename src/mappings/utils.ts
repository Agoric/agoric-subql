export function extractBrand(str: string): string {
  return str.replace("Alleged: ", "").replace(" brand", "");
}

export function extractStoragePath(value: string): string {
  const parts = value.split("\x00");
  if (parts.length === 0) {
    return "";
  }

  const length = parseInt(parts.shift() || "0", 10);

  if (length !== parts.length) {
    throw new Error(`unexpected path ${value}`);
  }

  return parts.join(".");
}

export function resolveBrandNamesAndValues(body: any, names: { [key: string]: any } = {}): void {
  const slotPattern = /^\$(\d+).?(.*)/;
  const numberPattern = /^[+-]{1}(\d+)$/;

  if (typeof body === "object" && body !== null) {
    for (const key in body) {
      if (body.hasOwnProperty(key)) {
        const value = body[key];

        // Deprecated but exists in chains
        if (typeof value === "object" && value !== null) {
          if (value["@qclass"] === "slot") {
            if (value["iface"]) {
              names[value["index"]] = extractBrand(value["iface"]);
            }

            if (value["index"] in names) {
              body["__" + key] = names[value["index"]];
            }
          }

          if (value["@qclass"] === "bigint") {
            body["__" + key] = value["digits"];
          }
        }

        // Smallcaps
        if (typeof value === "string") {
          const sm = value.match(slotPattern);
          if (sm && sm.length > 0) {
            const idx = parseInt(sm[1], 10);

            if (sm[2] !== "") {
              names[idx] = extractBrand(sm[2]);
            }

            if (idx in names) {
              body["__" + key] = names[idx];
            }

            continue;
          }

          const nm = value.match(numberPattern);
          if (nm) {
            body["__" + key] = nm[1];
          }
        } else {
          resolveBrandNamesAndValues(value, names);
        }
      }
    }
  } else if (Array.isArray(body)) {
    for (const item of body) {
      resolveBrandNamesAndValues(item, names);
    }
  }
}

export function getStateChangeModule(path: string): string {
  return path.split(".")[0] + "." + path.split(".")[1];
}

export function b64decode(val: string) {
  return new Buffer(val, "base64").toString();
}

export function b64encode(val: string) {
  return Buffer.from(val).toString("base64");
}

export function dateToDayKey(timestamp: any): number {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  return parseInt(`${year}${month}${day}`);
}
