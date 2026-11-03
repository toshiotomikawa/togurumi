# Licensed rating star

The Flaticon Animals and nature rating star is a private build input, not a
redistributable repository asset. Its path must not be pasted into source code.
Keep the license certificate and original archive outside the repository.

For the production drawing, copy the privately stored, prepared `star.svg` into
`src/assets/icons/star.svg` before running `npm run build` or the Vercel CLI.
The prepared SVG has one path and the 0 0 512 512 viewBox. The build reads only
that path, preserving inline SVG, currentColor, dimensions and accessibility.
An absent asset uses an original geometric star, so a clean Git checkout builds.
An invalid present asset fails the build rather than silently changing artwork.

`.gitignore` excludes the licensed file. `.vercelignore` intentionally allows
that one prepared SVG in a CLI source upload, while excluding private archives,
certificates, credentials and agent files. Never upload the original pack.

A Vercel deployment built only from GitHub does not receive ignored assets and
uses the fallback. To preserve the production drawing, deploy the reviewed
checkout with the privately supplied SVG through the Vercel CLI (or supply the
same asset through a private CI input). Verify that the production bundle has
the licensed path before promotion. Do not replace production with an unchecked
Git-only build.

Removing the file in a new commit does not remove old Git objects, forks, clones
or caches. A history purge is a separate, disruptive operation requiring approval.
