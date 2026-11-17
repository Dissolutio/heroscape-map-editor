export declare const LOCAL_RELEASE_VERSION: string
export declare function resolveReleaseVersion(args: {
  env: Record<string, string | undefined>
  tags: string[] | null
  headTags: string[] | null
}): string
export declare function getBuildReleaseVersion(
  env?: Record<string, string | undefined>,
): string
