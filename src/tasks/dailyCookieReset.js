async function dailyCookieResetTask() {
  fb.discord.log("* Resetting daily cookies");
  console.log("* Resetting daily cookies");

  await fb.db.updateMany(
    "cookie",
    {},
    {
      $set: {
        claimedToday: false,
        giftedToday: false,
        usedSlot: false,
      },
    }
  );
}

module.exports = dailyCookieResetTask;
