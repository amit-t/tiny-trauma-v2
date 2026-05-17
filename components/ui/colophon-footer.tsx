import { ElsewhereStrip, type ElsewhereLink } from "./elsewhere-strip";

export type CurrentlyItem = {
  label: string;
  value: React.ReactNode;
};

export function ColophonFooter({
  about,
  hand = "if you found something here, tell someone.",
  currently = [],
  elsewhere = [],
  base,
}: {
  about: React.ReactNode;
  hand?: React.ReactNode;
  currently?: CurrentlyItem[];
  elsewhere?: ElsewhereLink[];
  base?: React.ReactNode;
}) {
  return (
    <>
      <footer className="colophon">
        <div>
          <h4>about the place</h4>
          <p>{about}</p>
          {hand && <span className="hand">{hand}</span>}
        </div>
        {currently.length > 0 && (
          <div className="currently">
            <h4>currently</h4>
            <dl>
              {currently.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </footer>

      {elsewhere.length > 0 && <ElsewhereStrip links={elsewhere} />}

      {base && <div className="colophon-base">{base}</div>}
    </>
  );
}
