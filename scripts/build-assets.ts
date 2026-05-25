import { build } from 'esbuild';
import { glob } from 'glob';
import { copy, remove } from 'fs-extra';
import { join } from 'path';

async function buildAssets() {
    await copy('src/lang', 'dist/src/lang');

    const srcDir = 'assets';
    const outDir = 'dist/assets';

    await remove(outDir);

    const nodeFiles = await glob(`${srcDir}/public/nodejs/**/*.ts`);

    if (nodeFiles.length > 0) {
        await build({
            entryPoints: nodeFiles,
            outdir: join(outDir, 'public/nodejs/esm'),
            bundle: true,
            format: 'esm',
            platform: 'node',
            target: 'node16',
            sourcemap: false
        });
        console.log(`✅ Built ${nodeFiles.length} Node.js files`);

        await build({
            entryPoints: nodeFiles,
            outdir: join(outDir, 'public/nodejs/cjs'),
            bundle: true,
            format: 'cjs',
            platform: 'node',
            target: 'node16',
            sourcemap: false
        });
        console.log(`✅ Built ${nodeFiles.length} Node.js files`);
    }

    await copy(srcDir, outDir, {
        filter: (src) => {
            return !src.startsWith('assets\\public\\nodejs');
        }
    });

    console.log('✅ Assets build complete');
}

buildAssets().catch(console.error);