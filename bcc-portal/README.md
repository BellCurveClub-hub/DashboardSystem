# Bell Curve Club — Centre Portal

Booking, schedule, lesson credits, billing, homework, test results and rewards
for a tuition centre. One static page, a Supabase backend, four roles.

## Setting it up

1. **Create a Supabase project.** Copy the project URL and the *anon public*
   key into the `CONFIG` block at the top of `index.html`. Both are safe to
   commit — row-level security is what protects the data, which is why step 2
   is not optional.

2. **Run the schema.** Sign in to the app, open **Setup & SQL**, copy the
   script and run it in the Supabase SQL editor. It is safe to run again
   after every update.

   If the editor objects to `alter type user_role add value 'tutor'`, run that
   one line on its own first, then the rest.

3. **Make yourself an admin.** Sign up through the app, then in the Supabase
   table editor set your row in `profiles` to role `admin`. Only the first one
   is done by hand; after that you manage roles from the portal.

4. **Fill in the centre details.** Settings → Centre: name, slogan, the
   address block that prints on invoices, and your PayNow ID.

5. **Deploy.** Commit `index.html` and turn on GitHub Pages. That is the whole
   deployment.

## Taking payment

Out of the box the centre runs on manual PayNow: send the invoice, the parent
transfers, you record the payment and the lesson credits are added.

To take card and PayNow payments in the app, deploy the Edge Function shown in
the Setup tab:

```bash
supabase functions deploy hitpay --no-verify-jwt
```

Set `HITPAY_API_KEY`, `HITPAY_SALT`, `HITPAY_BASE` and `SITE_URL` as Edge
Function secrets, then switch on **Show parents a Pay now button** in
Settings. The `--no-verify-jwt` flag lets HitPay's webhook reach the function;
the sign-in check for the checkout route is done inside the function itself.

## Report slips

School results need a photo of the report slip. These sit in a private
`report-slips` bucket and are only ever read through short-lived signed links.
They contain a child's name, school and grades — treat the bucket accordingly,
and include it in your PDPA review.

## Development

```bash
npm install
npm test          # every route, every role, against a fake Supabase
npm run test:empty # the same, with no data at all
```

Both must print **all green** before you ship. See `CLAUDE.md` for the
conventions and the decisions that are already settled.
