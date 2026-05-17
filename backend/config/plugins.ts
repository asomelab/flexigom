export default ({ env }: { env: any }) => ({
  upload: {
    config: {
      provider: "cloudinary",
      providerOptions: {
        cloud_name: env("CLOUDINARY_NAME"),
        api_key: env("CLOUDINARY_KEY"),
        api_secret: env("CLOUDINARY_SECRET"),
      },
      actionOptions: {
        upload: {},
        delete: {},
      },
    },
  },
  backup: {
    enabled: true,
    config: {
      cronSchedule: "0 6 * * *",
      storageService: "aws-s3",
      awsAccessKeyId: env("BACKUP_AWS_ACCESS_KEY_ID"),
      awsSecretAccessKey: env("BACKUP_AWS_SECRET_ACCESS_KEY"),
      awsRegion: env("BACKUP_AWS_REGION"),
      awsS3Bucket: env("BACKUP_AWS_S3_BUCKET"),
      databaseDriver: env("DATABASE_CLIENT", "postgres"),
      disableUploadsBackup: true,
      allowCleanup: true,
      cleanupCronSchedule: "0 7 * * *",
      timeToKeepBackupsInSeconds: 604800,
    },
  },
});
