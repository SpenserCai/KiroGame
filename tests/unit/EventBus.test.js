/**
 * EventBus 单元测试
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { EventBus, GameEvents } from '../../src/core/EventBus.js';

test('EventBus - 订阅和发布事件', () => {
  const eventBus = new EventBus();
  let received = null;

  eventBus.on('test:event', (data) => {
    received = data;
  });

  eventBus.emit('test:event', { message: 'Hello' });

  assert.strictEqual(received.message, 'Hello');
});

test('EventBus - 取消订阅', () => {
  const eventBus = new EventBus();
  let count = 0;

  const callback = () => {
    count++;
  };

  eventBus.on('test:event', callback);
  eventBus.emit('test:event');
  assert.strictEqual(count, 1);

  eventBus.off('test:event', callback);
  eventBus.emit('test:event');
  assert.strictEqual(count, 1); // 不应该增加
});

test('EventBus - once 一次性订阅', () => {
  const eventBus = new EventBus();
  let count = 0;

  eventBus.once('test:event', () => {
    count++;
  });

  eventBus.emit('test:event');
  assert.strictEqual(count, 1);

  eventBus.emit('test:event');
  assert.strictEqual(count, 1); // 不应该增加
});

test('EventBus - 多个订阅者', () => {
  const eventBus = new EventBus();
  let count1 = 0;
  let count2 = 0;

  eventBus.on('test:event', () => {
    count1++;
  });

  eventBus.on('test:event', () => {
    count2++;
  });

  eventBus.emit('test:event');

  assert.strictEqual(count1, 1);
  assert.strictEqual(count2, 1);
});

test('EventBus - 事件名称验证', () => {
  const eventBus = new EventBus();

  assert.throws(() => {
    eventBus.on('', () => {});
  }, /事件名称必须是非空字符串/);

  assert.throws(() => {
    eventBus.on(123, () => {});
  }, /事件名称必须是非空字符串/);
});

test('EventBus - 回调验证', () => {
  const eventBus = new EventBus();

  assert.throws(() => {
    eventBus.on('test:event', 'not a function');
  }, /回调必须是函数/);
});

test('EventBus - listenerCount', () => {
  const eventBus = new EventBus();

  assert.strictEqual(eventBus.listenerCount('test:event'), 0);

  eventBus.on('test:event', () => {});
  assert.strictEqual(eventBus.listenerCount('test:event'), 1);

  eventBus.on('test:event', () => {});
  assert.strictEqual(eventBus.listenerCount('test:event'), 2);
});

test('EventBus - clear', () => {
  const eventBus = new EventBus();
  let count = 0;

  eventBus.on('test:event', () => {
    count++;
  });

  eventBus.clear();
  eventBus.emit('test:event');

  assert.strictEqual(count, 0);
});

console.log('✅ EventBus 所有测试通过');
