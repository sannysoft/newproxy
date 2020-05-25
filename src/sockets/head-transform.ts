import { Transform } from 'stream';

/**
 * It reads socket until the head part is over and transforms the head by calling headTransformFn
 * @param headTransformFn
 */
export const headTransform = (headTransformFn: (head: string) => string): Transform => {
  let isHead = true;
  let currentHead = '';

  return new Transform({
    transform(chunk, encoding, cb) {
      if (isHead) {
        currentHead += chunk.toString().replace(/\r\n/, '\n');
        const parts = currentHead.split(/\n\n/);

        if (parts.length === 2) {
          // Head fully received
          const newHead = headTransformFn(parts[0]);
          this.push(`${newHead}\n\n${parts[1]}`);
          isHead = false;
        }
      } else this.push(chunk);
      cb();
    },

    flush(cb) {
      cb();
    },
  });
};
