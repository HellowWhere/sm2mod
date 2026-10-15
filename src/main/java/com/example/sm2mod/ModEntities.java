package com.example.sm2mod;

import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.MobCategory;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public class ModEntities {
    public static final DeferredRegister<EntityType<?>> ENTITIES =
            DeferredRegister.create(ForgeRegistries.ENTITY_TYPES, Sm2Mod.MODID);

    public static final RegistryObject<EntityType<BoltProjectile>> BOLT = ENTITIES.register("bolt",
            () -> EntityType.Builder.<BoltProjectile>of(BoltProjectile::new, MobCategory.MISC)
                    .sized(0.2F, 0.2F).clientTrackingRange(8).updateInterval(1).build("bolt"));

    public static final RegistryObject<EntityType<MeltaProjectile>> MELTA = ENTITIES.register("melta",
            () -> EntityType.Builder.<MeltaProjectile>of(MeltaProjectile::new, MobCategory.MISC)
                    .sized(0.3F, 0.3F).clientTrackingRange(8).updateInterval(1).build("melta"));

    public static final RegistryObject<EntityType<GrenadeEntity>> GRENADE = ENTITIES.register("frag_grenade",
            () -> EntityType.Builder.<GrenadeEntity>of(GrenadeEntity::new, MobCategory.MISC)
                    .sized(0.3F, 0.3F).clientTrackingRange(6).updateInterval(2).build("frag_grenade"));
}
