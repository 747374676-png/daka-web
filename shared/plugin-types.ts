// ---- plugin:reward_checkin_apaas_database_1 ----
// ============================================================
// 插件 reward_checkin_apaas_database_1 (奖励打卡应用aPaaS数据库) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface RewardCheckinApaasDatabaseOneListrecordsInput {
  /** 用户的打卡记录列表 */
  checkin_records?: string[];
  /** 用户的初始奖励余额 */
  initial_balance?: string;
  /** 用户的消费记录列表 */
  consumption_records?: string[];
  /** 用户获得的时间奖励列表 */
  time_rewards?: string[];
  /** 用户唯一同步码，用于识别用户身份和查询更新数据 */
  sync_code: string;
  /** 用户的待办事项列表 */
  task_list?: string[];
}

/**
 * capabilityClient.load('reward_checkin_apaas_database_1').call<RewardCheckinApaasDatabaseOneListrecordsOutput>('listRecords', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { items, total } = result;
 */
export interface RewardCheckinApaasDatabaseOneListrecordsOutput {
  /** [object Object] */
  items: {
    id: string;
    fields: {
      sync_code: unknown;
      task_list: unknown;
      checkin_records: unknown;
      initial_balance: unknown;
      consumption_records: unknown;
      time_rewards: unknown;
    };
  }[];
  /** [object Object] */
  total: number;
}

export interface RewardCheckinApaasDatabaseOneGetrecordInput {
  /** [object Object] */
  id: string;
  /** [object Object] */
  select?: string[];
}

/**
 * capabilityClient.load('reward_checkin_apaas_database_1').call<RewardCheckinApaasDatabaseOneGetrecordOutput>('getRecord', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { item } = result;
 */
export interface RewardCheckinApaasDatabaseOneGetrecordOutput {
  /** [object Object] */
  item: unknown;
}

export interface RewardCheckinApaasDatabaseOneCreaterecordInput {
  /** [object Object] */
  fields: Record<string, unknown>;
}

/**
 * capabilityClient.load('reward_checkin_apaas_database_1').call<RewardCheckinApaasDatabaseOneCreaterecordOutput>('createRecord', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { id } = result;
 */
export interface RewardCheckinApaasDatabaseOneCreaterecordOutput {
  /** [object Object] */
  id: string;
}

export interface RewardCheckinApaasDatabaseOneUpdaterecordInput {
  /** [object Object] */
  id: string;
  /** [object Object] */
  fields: Record<string, unknown>;
}

/**
 * capabilityClient.load('reward_checkin_apaas_database_1').call<RewardCheckinApaasDatabaseOneUpdaterecordOutput>('updateRecord', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { id } = result;
 */
export interface RewardCheckinApaasDatabaseOneUpdaterecordOutput {
  /** [object Object] */
  id: string;
}

export interface RewardCheckinApaasDatabaseOneDeleterecordInput {
  /** [object Object] */
  id: string;
}

/**
 * capabilityClient.load('reward_checkin_apaas_database_1').call<RewardCheckinApaasDatabaseOneDeleterecordOutput>('deleteRecord', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { success } = result;
 */
export interface RewardCheckinApaasDatabaseOneDeleterecordOutput {
  /** [object Object] */
  success: boolean;
}
// ---- end:reward_checkin_apaas_database_1 ----