# Deploy the landing

The organization manages deployment through [NextNode infrastructure](https://github.com/NextNodeSolutions/infrastructure/blob/main/docs/deployment.md). A ruleset runs `Deploy plan` on pull requests into the default branch. A merge moves the head of the standing pull request from `main` into `deployments`, where the organization ruleset runs `Deploy`.

## Verify the migration before enabling deployment

- Check every deployable in the workspace against the [central `nextnode.toml` schema](https://github.com/NextNodeSolutions/infrastructure/blob/main/docs/nextnode-toml.md). The plan reads the whole workspace, including the dashboard. The landing build must still provide the Worker and static assets, and the release must supply the signup database, rate limiter, Resend credential, and canonical site URL. Confirm environment support before relying on a development deployment gate.
- Record the apex custom domain target, the serving Worker version and traffic share, and the D1 ID bound as `DB`. The [October 6 archive run](https://github.com/NextNodeSolutions/syneva-archive/actions/runs/37514439829) deployed `syneva-landing-production-web` and migrated `syneva-landing-production-d1`. Compare the live ID with `cloudflare_d1_database.d1` and `d1_database_id` in HCP Terraform workspace `nextnode/syneva-landing-production`.
- Review the central release's derived Worker and database names. The documented owner tag hands over a Worker only when its name already matches the one the platform derives. The release also checks whether the hostname belongs to another Worker. Keep deployment disabled until the infrastructure owner has approved and verified a way to preserve the existing database ID and reconcile its ownership in Pulumi without leaving two systems to manage it.
- Verify the database's migration ledger, `subscribers` schema, and recovery point using an authorized reader. Keep subscriber rows out of the evidence. Verify the central plan, runtime bindings, and vault access before allowing a production release. Record the release run, commit, serving version, bound database ID, and `/healthz` result after cutover.

## Roll back

For a code regression, revert the faulty release through the organization workflow after checking that the previous code works with the current schema. An authorized Cloudflare operator can restore the recorded Worker version if its bindings and schema still work. If the apex moved, restore the recorded prior target. Recheck `/healthz`, the serving version, and the D1 binding. Worker rollback leaves migrations and subsequent signups in place. Recover D1 separately if needed, since restoring a snapshot over the live database can discard later signups.
