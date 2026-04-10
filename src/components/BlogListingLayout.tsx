import { Card } from '@/components/Card';
import { Post } from '@/payload-types';

export const BlogListingLayout = ({ posts }: { posts: Post[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post) => (
        <Card key={post.id} doc={post} relationTo="posts" showCategories />
      ))}
    </div>
  );
};
