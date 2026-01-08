function enqueuePostShare(post) {
  if (!post) return;
  const targets = [];
  if (post.shareToFacebook) targets.push('facebook');
  if (post.shareToInstagram) targets.push('instagram');
  if (targets.length === 0) return;

  setImmediate(() => {
    console.log(
      `Queued post ${post._id} for sharing to: ${targets.join(', ')}`,
    );
  });
}

module.exports = {
  enqueuePostShare,
};
