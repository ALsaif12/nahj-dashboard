# Deploying NAHJ Dashboard to Render

End-to-end walkthrough. Time: ~15 minutes the first time.

You'll need:
- A free GitHub account (or GitLab — adapt the URL)
- A Render account → <https://dashboard.render.com/register> (free to sign up; deployment costs ~$7/month)
- Git installed locally (`git --version` to check)

---

## 1 · Push the repo to GitHub

From the `nahj-dashboard/` folder in a terminal:

```bash
# Once per repo — initialise git if you haven't already
git init
git add .
git commit -m "Initial commit"

# Create an empty repo on github.com first (no README, no .gitignore),
# then copy the URL it gives you and run:
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

If the push fails because the repo is too big, check that `node_modules/`
and `.next/` are ignored (they should be, via `.gitignore`).

---

## 2 · Create the Render service from the blueprint

1. Sign in at <https://dashboard.render.com>.
2. Top-right: **New +** → **Blueprint**.
3. Connect your GitHub account if prompted, then pick the repo you just pushed.
4. Render reads `render.yaml` and shows a preview:
   - Service: `nahj-dashboard` (Web Service, Node, Starter plan)
   - Disk: `nahj-data` (1 GB, mounted at `/var/lib/nahj-data`)
   - Region: Frankfurt
   - Env vars: `NODE_ENV`, `NAHJ_DATA_DIR`, `NAHJ_SESSION_SECRET` (auto-generated)
5. Click **Apply**. Render starts the first build.

---

## 3 · Set the four passwords

While the first build runs, open the new service → **Environment** tab → scroll
to **Environment Variables**. Four entries appear with empty values:

| Key | Suggested value |
|---|---|
| `NAHJ_PW_EXEC` | a strong password for the CEO account |
| `NAHJ_PW_BADIR` | password for Badir program manager |
| `NAHJ_PW_RISALA` | password for Risala program manager |
| `NAHJ_PW_IKTASHIF` | password for Iktashif Nahj program manager |

Click **Save Changes**. Render redeploys with the new values.

These passwords only take effect on the **first** deploy, when the seed
`users.json` file is written to the persistent disk. After that, change
passwords via the in-app **Admin → Users** screen.

---

## 4 · First sign-in

When the deploy turns green, click the URL Render gives you
(`https://nahj-dashboard-xxxx.onrender.com`) and sign in as `executive`
with the password you set in step 3.

From the **Admin** panel you can:
- Add board members, viewers, sponsors, additional program managers
- Reset passwords
- Toggle who can access which panel
- Review the audit log of every login, submission, and admin action

---

## 5 · Updating the Excel workbook

Two ways:

**Option A — commit a new file (recommended).** Replace `data/nahj.xlsx`
locally, then `git commit -am "Update workbook" && git push`. Render auto-redeploys
in about 90 seconds.

**Option B — upload via Render shell.** Open the service → **Shell** tab →
upload the new file with `scp` / `rsync` / `curl`. Then either restart the
service (Manual Deploy → Deploy latest commit, with no code change) or hit
the in-app **Refresh data** button.

---

## 6 · Custom domain (optional)

Render → service → **Settings** → **Custom Domains** → add e.g. `dashboard.nahj.org`.
Render gives you a CNAME to add at your DNS provider. SSL is automatic.

---

## Troubleshooting

**"Workbook not found" 500 on first request.** The `data/nahj.xlsx` file
isn't committed. Verify with `git ls-files data/nahj.xlsx` — if blank, run
`git add -f data/nahj.xlsx && git commit && git push`. (The `-f` is only
needed if a `.gitignore` rule excluded it.)

**Login works but nothing saves.** The persistent disk didn't mount.
Check service → **Disks** tab — there should be one disk named `nahj-data`
attached and `df -h` in the Shell should show `/var/lib/nahj-data`. If
missing, edit the blueprint and re-apply.

**Service is slow on first request after idle.** You're on the Free plan.
Upgrade to Starter — the blueprint defaults to Starter already, so this only
happens if you downgraded.

**I want to reset everything.** Delete the service and reimport the blueprint,
or `rm -rf /var/lib/nahj-data/*` from the Shell. Either wipes users / actuals /
audit back to seed defaults.

---

## What lives where on Render

```
/opt/render/project/src/        ← code from your repo
  ├── data/nahj.xlsx            ← read-only, refreshed by git push
  └── ...

/var/lib/nahj-data/             ← persistent disk, survives redeploys
  ├── users.json
  ├── actuals.json
  └── audit.json
```
