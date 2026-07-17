import path from 'node:path';
import { createApp } from './app.ts';

type CliOptions = {
  mapPath: string;
  bookingsPath: string;
};

function parseCliOptions(argv: string[]): CliOptions {
  const getArgValue = (flag: '--map' | '--bookings'): string | undefined => {
    const flagIndex = argv.indexOf(flag);
    if (flagIndex === -1) {
      return undefined;
    }

    return argv[flagIndex + 1];
  };

  const mapArg = getArgValue('--map');
  const bookingsArg = getArgValue('--bookings');

  return {
    mapPath: path.resolve(mapArg ?? path.join(process.cwd(), 'map.ascii')),
    bookingsPath: path.resolve(bookingsArg ?? path.join(process.cwd(), 'bookings.json')),
  };
}

const { mapPath, bookingsPath } = parseCliOptions(process.argv.slice(2));
const app = createApp({ mapPath, bookingsPath });
const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Using map file: ${mapPath}`);
  console.log(`Using bookings file: ${bookingsPath}`);
});