"use client";
import * as collection from "@dicebear/collection";

export function AvatarSelector() {
  const collectionsArr = Object.entries(collection).map(([key, value]) => ({
    key,
    value,
  }));

  const createUrl = (name: string) => {
    const styleName = getStyleName(name);
    const url = `https://api.dicebear.com/9.x/${styleName}/svg`;
    return url;
  };

  return (
    <section className="flex overflow-auto gap-4">
      {collectionsArr.map((item) => (
        <div
          key={item.key}
          className="min-w-[100px] flex flex-col items-center"
        >
          <img
            src={createUrl(item.key)}
            alt={item.key}
            className="w-20 h-20 rounded-full"
          />
          <span className="text-sm mt-1">{item.key}</span>
        </div>
      ))}
    </section>
  );
}
const getStyleName = (name: string) =>
  name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
